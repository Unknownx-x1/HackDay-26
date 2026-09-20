import numpy as np
import librosa
from scipy.signal import get_window
import parselmouth
from parselmouth.praat import call
from typing import Dict, Any, List, Tuple

def compute_cpp(y: np.ndarray, sr: int = 16000, frame_len: float = 0.03, hop_len: float = 0.01) -> float:
    """
    Computes Cepstral Peak Prominence (CPP) in the quefrency range 60Hz - 400Hz.
    CPP measures the regularity of harmonic vocal fold vibration.
    """
    frame_size = int(frame_len * sr)
    hop_size = int(hop_len * sr)
    if len(y) < frame_size * 2:
        return 0.0

    window = get_window('hamming', frame_size)
    min_q = max(1, int(sr / 400.0))
    max_q = min(1024, int(sr / 60.0))

    if min_q >= max_q:
        return 0.0

    cpp_values = []
    for i in range(0, len(y) - frame_size, hop_size):
        frame = y[i:i + frame_size] * window
        if np.std(frame) < 1e-4:
            continue
        spec = np.abs(np.fft.rfft(frame, n=2048))
        cepstrum = np.real(np.fft.irfft(np.log(spec + 1e-12)))

        q_slice = cepstrum[min_q:max_q]
        if len(q_slice) == 0:
            continue
        peak_val = np.max(q_slice)
        peak_idx = min_q + np.argmax(q_slice)

        # Baseline linear fit across quefrency window
        x = np.arange(min_q, max_q)
        slope, intercept = np.polyfit(x, q_slice, 1)
        baseline = slope * peak_idx + intercept
        cpp_val = max(0.0, float(peak_val - baseline))
        cpp_values.append(cpp_val)

    return float(np.mean(cpp_values)) if cpp_values else 0.0

def analyze_breath_and_pauses(
    y: np.ndarray,
    sr: int = 16000,
    top_db: float = 28.0
) -> Dict[str, Any]:
    """
    Analyzes pause naturalness, silence floor depth, and pre-utterance inhalation breath cues.
    Synthetic speech often displays pure digital silence (-80dB or lower) and lacks inhalation breaths.
    """
    duration = len(y) / sr
    if duration < 0.3:
        return {
            "pause_count": 0,
            "pause_rate": 0.0,
            "mean_pause_sec": 0.0,
            "pause_std_sec": 0.0,
            "silence_floor_db": -60.0,
            "breaths_detected": 0,
            "breath_pause_ratio": 0.0,
            "digital_zero_ratio": 0.0,
            "has_digital_zero_lead_in": False,
            "pause_intervals": []
        }

    # Frame-level RMS energy
    hop_length = 128
    frame_length = 512
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    peak_rms = max(1e-5, np.max(rms))
    rms_db = 20 * np.log10(np.maximum(rms, 1e-6) / peak_rms)
    
    # Silence frames are frames below -top_db from peak
    is_silent = (rms_db < -top_db)
    
    # Global digital zero ratio (< 1e-4 sample threshold) and lead-in check
    sample_zero_ratio = float(np.mean(np.abs(y) < 1.0e-4))
    lead_in_samples = min(len(y), int(0.12 * sr))
    lead_in_zero_ratio = float(np.mean(np.abs(y[:lead_in_samples]) < 1.0e-4)) if lead_in_samples > 0 else 0.0
    has_digital_zero_lead_in = bool(lead_in_zero_ratio > 0.85 and peak_rms > 0.01)

    # Within-silence zero ratio & acoustic silence floor
    # Evaluates near-zero sample ratio strictly within quiet/pause frames (decoupled from speech tempo)
    silent_mask = np.zeros(len(y), dtype=bool)
    for idx, silent in enumerate(is_silent):
        if silent:
            s_start = idx * hop_length
            s_end = min(len(y), s_start + frame_length)
            silent_mask[s_start:s_end] = True

    if np.any(silent_mask):
        within_silence_zero_ratio = float(np.mean(np.abs(y[silent_mask]) < 1.0e-4))
        sil_rms_db = 20 * np.log10(np.maximum(rms[is_silent], 1e-6))
        silence_floor_db = float(np.percentile(sil_rms_db, 10))
    else:
        # Fallback for continuous speech without pauses > top_db: lowest 15% energy frames
        low_idx = np.argsort(rms)[:max(1, int(0.15 * len(rms)))]
        low_mask = np.zeros(len(y), dtype=bool)
        for idx in low_idx:
            low_mask[idx * hop_length : min(len(y), idx * hop_length + frame_length)] = True
        within_silence_zero_ratio = float(np.mean(np.abs(y[low_mask]) < 1.0e-4))
        sil_rms_db = 20 * np.log10(np.maximum(rms[low_idx], 1e-6))
        silence_floor_db = float(np.percentile(sil_rms_db, 10))

    # Synthetic silence override: if quiet regions have >= 10% zeros, floor is synthetic
    if within_silence_zero_ratio >= 0.10 or sample_zero_ratio >= 0.05:
        silence_floor_db = min(silence_floor_db, -85.0)

    # Find contiguous silent intervals
    pause_intervals = []
    pause_durations = []
    breaths_detected = 0

    min_pause_frames = int(0.12 * sr / hop_length)  # At least 120ms
    in_pause = False
    p_start_frame = 0

    for idx, silent in enumerate(is_silent):
        if silent and not in_pause:
            in_pause = True
            p_start_frame = idx
        elif not silent and in_pause:
            in_pause = False
            p_end_frame = idx
            if (p_end_frame - p_start_frame) >= min_pause_frames:
                p_start_samp = p_start_frame * hop_length
                p_end_samp = min(len(y), p_end_frame * hop_length)
                p_dur = (p_end_samp - p_start_samp) / sr
                pause_intervals.append((p_start_samp, p_end_samp))
                pause_durations.append(p_dur)

                # Check for breath in the final 200ms before speech resumes
                # Real inhalation breaths require:
                # 1. Natural acoustic floor (cannot exist in digital zero environments)
                # 2. Minimum pause duration >= 220ms (not a rapid 150ms consonant stop)
                # 3. Evaluation starts after previous syllable decay (+80ms)
                if silence_floor_db > -75.0 and sample_zero_ratio < 0.04 and p_dur >= 0.22:
                    pre_speech_start = max(p_start_samp + int(0.08 * sr), p_end_samp - int(0.25 * sr))
                    if p_end_samp - pre_speech_start >= 256:
                        pause_tail = y[pre_speech_start:p_end_samp]
                        tail_rms = np.sqrt(np.mean(pause_tail**2) + 1e-12)
                        tail_db = 20 * np.log10(tail_rms / peak_rms)
                        if -48.0 < tail_db < -18.0:
                            # Check high-frequency vs low-frequency energy in pause tail
                            spec = np.abs(np.fft.rfft(pause_tail, n=512))
                            freqs = np.fft.rfftfreq(512, d=1.0/sr)
                            mid_energy = np.mean(spec[(freqs >= 1400) & (freqs <= 4200)])
                            low_energy = np.mean(spec[(freqs >= 100) & (freqs < 1400)]) + 1e-8
                            if mid_energy > 0.6 * low_energy:
                                breaths_detected += 1

    # End of audio pause check
    if in_pause and (len(is_silent) - p_start_frame) >= min_pause_frames:
        p_start_samp = p_start_frame * hop_length
        p_end_samp = len(y)
        pause_intervals.append((p_start_samp, p_end_samp))
        pause_durations.append((p_end_samp - p_start_samp) / sr)

    mean_pause = float(np.mean(pause_durations)) if pause_durations else 0.0
    pause_std = float(np.std(pause_durations)) if len(pause_durations) > 1 else 0.0
    pause_rate = len(pause_durations) / max(0.5, duration)
    breath_ratio = breaths_detected / max(1, len(pause_durations))

    return {
        "pause_count": len(pause_durations),
        "pause_rate": round(pause_rate, 2),
        "mean_pause_sec": round(mean_pause, 3),
        "pause_std_sec": round(pause_std, 3),
        "silence_floor_db": round(silence_floor_db, 1),
        "breaths_detected": breaths_detected,
        "breath_pause_ratio": round(breath_ratio, 2),
        "digital_zero_ratio": round(sample_zero_ratio, 4),
        "within_silence_zero_ratio": round(within_silence_zero_ratio, 4),
        "has_digital_zero_lead_in": has_digital_zero_lead_in,
        "pause_intervals": [
            {"start_sec": round(s / sr, 3), "end_sec": round(e / sr, 3)}
            for s, e in pause_intervals
        ]
    }

def extract_acoustic_features(y: np.ndarray, sr: int = 16000) -> Dict[str, Any]:
    """
    Extracts classical forensic acoustic features across 4 pillars:
    1. Pitch Stability (Jitter, Shimmer via Parselmouth/Praat)
    2. Harmonics & Periodicity (HNR, CPP)
    3. Spectral Texture (MFCC variance, Spectral Flatness, Rolloff)
    4. Breath & Silence Dynamics (Pause regularity, silence floor, breath cues)
    """
    duration = float(len(y) / sr)
    if duration < 0.2:
        raise ValueError("Audio clip is too short (must be at least 0.2 seconds).")

    # 1. Parselmouth Praat Features (Pitch Jitter, Shimmer, HNR)
    # Trim lead/trail digital silence before Praat to avoid cycle boundary artifacts on zero edges
    y_for_praat = y
    if len(y) > int(0.5 * sr):
        try:
            trimmed, _ = librosa.effects.trim(y, top_db=38)
            if len(trimmed) > int(0.3 * sr):
                y_for_praat = trimmed
        except Exception:
            y_for_praat = y

    snd = parselmouth.Sound(y_for_praat, sampling_frequency=sr)
    
    # Pitch extraction (human f0 typically 75Hz - 500Hz)
    pitch = call(snd, "To Pitch", 0.0, 75.0, 500.0)
    mean_f0 = call(pitch, "Get mean", 0.0, 0.0, "Hertz")
    std_f0 = call(pitch, "Get standard deviation", 0.0, 0.0, "Hertz")
    
    # Safe handling of unvoiced / NaN
    mean_f0 = float(mean_f0) if not np.isnan(mean_f0) else 0.0
    std_f0 = float(std_f0) if not np.isnan(std_f0) else 0.0

    # PointProcess for cycle-by-cycle jitter & shimmer
    point_process = call([snd, pitch], "To PointProcess (cc)")
    
    try:
        jitter_local = float(call(point_process, "Get jitter (local)", 0.0, 0.0, 0.0001, 0.02, 1.3))
        if np.isnan(jitter_local): jitter_local = 0.001
    except Exception:
        jitter_local = 0.001

    try:
        jitter_rap = float(call(point_process, "Get jitter (rap)", 0.0, 0.0, 0.0001, 0.02, 1.3))
        if np.isnan(jitter_rap): jitter_rap = 0.0008
    except Exception:
        jitter_rap = 0.0008

    try:
        jitter_ppq5 = float(call(point_process, "Get jitter (ppq5)", 0.0, 0.0, 0.0001, 0.02, 1.3))
        if np.isnan(jitter_ppq5): jitter_ppq5 = 0.0008
    except Exception:
        jitter_ppq5 = 0.0008

    try:
        shimmer_local = float(call([snd, point_process], "Get shimmer (local)", 0.0, 0.0, 0.0001, 0.02, 1.3, 1.6))
        if np.isnan(shimmer_local): shimmer_local = 0.015
    except Exception:
        shimmer_local = 0.015

    try:
        shimmer_apq3 = float(call([snd, point_process], "Get shimmer (apq3)", 0.0, 0.0, 0.0001, 0.02, 1.3, 1.6))
        if np.isnan(shimmer_apq3): shimmer_apq3 = 0.01
    except Exception:
        shimmer_apq3 = 0.01

    try:
        shimmer_apq5 = float(call([snd, point_process], "Get shimmer (apq5)", 0.0, 0.0, 0.0001, 0.02, 1.3, 1.6))
        if np.isnan(shimmer_apq5): shimmer_apq5 = 0.01
    except Exception:
        shimmer_apq5 = 0.01

    # Harmonicity (HNR)
    try:
        harmonicity = call(snd, "To Harmonicity (cc)", 0.01, 75.0, 0.1, 1.0)
        hnr_mean = float(call(harmonicity, "Get mean", 0.0, 0.0))
        hnr_std = float(call(harmonicity, "Get standard deviation", 0.0, 0.0))
        if np.isnan(hnr_mean): hnr_mean = 14.0
        if np.isnan(hnr_std): hnr_std = 3.0
    except Exception:
        hnr_mean = 14.0
        hnr_std = 3.0

    # 2. Cepstral Peak Prominence (CPP)
    cpp = compute_cpp(y, sr=sr)

    # 3. Spectral Features (Energy Rolloff & Magnitude Wiener Flatness)
    stft = np.abs(librosa.stft(y, n_fft=1024, hop_length=256))
    power_stft = stft**2

    # Spectral Flatness (Wiener entropy on magnitude STFT |X|, measuring formant peakedness vs vocoder phase smearing)
    flatness_frames = np.exp(np.mean(np.log(stft + 1e-10), axis=0)) / (np.mean(stft, axis=0) + 1e-10)
    spectral_flatness_mean = float(np.mean(flatness_frames))
    spectral_flatness_std = float(np.std(flatness_frames))

    # Spectral Centroid & Rolloff (Energy boundary via power spectrum)
    centroid_frames = librosa.feature.spectral_centroid(S=power_stft, sr=sr)[0]
    spectral_centroid_mean = float(np.mean(centroid_frames))
    spectral_centroid_std = float(np.std(centroid_frames))

    rolloff_85 = librosa.feature.spectral_rolloff(S=stft, sr=sr, roll_percent=0.85)[0]
    rolloff_95 = librosa.feature.spectral_rolloff(S=stft, sr=sr, roll_percent=0.95)[0]
    spectral_rolloff_85 = float(np.mean(rolloff_85))
    spectral_rolloff_95 = float(np.mean(rolloff_95))

    # High frequency shelf ratio (> 6500Hz vs total)
    freqs = librosa.fft_frequencies(sr=sr, n_fft=1024)
    hf_mask = freqs >= 6500
    hf_energy = np.sum(stft[hf_mask, :])
    total_energy = np.sum(stft) + 1e-10
    hf_ratio = float(hf_energy / total_energy)

    # MFCCs (Coefficients 1 to 13)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, n_fft=1024, hop_length=256)
    mfcc_means = [float(x) for x in np.mean(mfcc, axis=1)]
    mfcc_vars = [float(x) for x in np.var(mfcc, axis=1)]
    # Higher order MFCC dynamic variance (coeffs 4-13 captures subtle vocal tract modulation)
    mfcc_high_order_var = float(np.mean(mfcc_vars[3:]))

    # Zero Crossing Rate
    zcr_frames = librosa.feature.zero_crossing_rate(y, frame_length=512, hop_length=128)[0]
    zcr_mean = float(np.mean(zcr_frames))
    zcr_std = float(np.std(zcr_frames))

    # 4. Breath and Pause Dynamics
    pause_metrics = analyze_breath_and_pauses(y, sr=sr)

    # Build comprehensive feature dictionary
    features = {
        "duration_sec": round(duration, 2),
        "mean_f0_hz": round(mean_f0, 1),
        "std_f0_hz": round(std_f0, 1),
        # Pitch Stability (Values in %: jitter 0.01 = 1%)
        "jitter_local_pct": round(jitter_local * 100.0, 3),
        "jitter_rap_pct": round(jitter_rap * 100.0, 3),
        "jitter_ppq5_pct": round(jitter_ppq5 * 100.0, 3),
        "shimmer_local_pct": round(shimmer_local * 100.0, 3),
        "shimmer_apq3_pct": round(shimmer_apq3 * 100.0, 3),
        "shimmer_apq5_pct": round(shimmer_apq5 * 100.0, 3),
        # Harmonics
        "hnr_mean_db": round(hnr_mean, 2),
        "hnr_std_db": round(hnr_std, 2),
        "cpp": round(cpp, 4),
        # Spectral Texture
        "spectral_flatness": round(spectral_flatness_mean, 5),
        "spectral_flatness_std": round(spectral_flatness_std, 5),
        "spectral_centroid_hz": round(spectral_centroid_mean, 1),
        "spectral_centroid_std": round(spectral_centroid_std, 1),
        "spectral_rolloff_85_hz": round(spectral_rolloff_85, 1),
        "spectral_rolloff_95_hz": round(spectral_rolloff_95, 1),
        "hf_energy_ratio": round(hf_ratio, 4),
        "mfcc_dynamic_variance": round(mfcc_high_order_var, 2),
        "zcr_mean": round(zcr_mean, 4),
        "zcr_std": round(zcr_std, 4),
        # Pause & Breath Metrics
        "pause_count": pause_metrics["pause_count"],
        "pause_rate": pause_metrics["pause_rate"],
        "mean_pause_sec": pause_metrics["mean_pause_sec"],
        "pause_std_sec": pause_metrics["pause_std_sec"],
        "silence_floor_db": pause_metrics["silence_floor_db"],
        "digital_zero_ratio": pause_metrics["digital_zero_ratio"],
        "within_silence_zero_ratio": pause_metrics["within_silence_zero_ratio"],
        "has_digital_zero_lead_in": pause_metrics["has_digital_zero_lead_in"],
        "breaths_detected": pause_metrics["breaths_detected"],
        "breath_pause_ratio": pause_metrics["breath_pause_ratio"],
        "pause_intervals": pause_metrics["pause_intervals"]
    }

    return features

def generate_spectrogram_data(
    y: np.ndarray,
    sr: int = 16000,
    target_time_bins: int = 120,
    target_freq_bins: int = 64
) -> Dict[str, Any]:
    """
    Generates a lightweight 2D spectrogram matrix suitable for fast HTML5 Canvas rendering,
    with time, frequency axes, and automatically detected acoustic anomaly zones.
    """
    duration = len(y) / sr
    
    # Compute STFT
    n_fft = 1024
    hop_length = max(64, int(len(y) / (target_time_bins * 1.2)))
    stft = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))
    
    # Convert to log-mel spectrogram or log magnitude
    mel_spec = librosa.feature.melspectrogram(S=stft**2, sr=sr, n_mels=target_freq_bins, fmax=sr//2)
    log_mel = librosa.power_to_db(mel_spec, ref=np.max)

    # Normalize to [0.0, 1.0]
    min_db = -70.0
    norm_spec = np.clip((log_mel - min_db) / (-min_db), 0.0, 1.0)

    # Downsample / reshape time bins if necessary
    if norm_spec.shape[1] > target_time_bins:
        indices = np.linspace(0, norm_spec.shape[1] - 1, target_time_bins, dtype=int)
        norm_spec = norm_spec[:, indices]

    # Convert to round 2-decimal floats for compact JSON payload
    matrix = np.round(norm_spec, 2).tolist()

    # Detect suspicious anomaly regions in the spectrogram:
    # 1. Unusually flat pitch / prosody zones
    # 2. Dead silence slices (digital zero floors)
    # 3. High-frequency cutoff shelves
    anomalies = []
    
    # Time step per column
    col_duration = duration / norm_spec.shape[1]
    
    # Check for dead silence columns (column max < 0.02)
    col_max = np.max(norm_spec, axis=0)
    silent_cols = np.where(col_max < 0.05)[0]
    if len(silent_cols) > 0:
        # Group contiguous silent columns
        groups = np.split(silent_cols, np.where(np.diff(silent_cols) > 1)[0] + 1)
        for g in groups:
            if len(g) >= 2:
                t_start = round(float(g[0] * col_duration), 2)
                t_end = round(float((g[-1] + 1) * col_duration), 2)
                anomalies.append({
                    "start_sec": t_start,
                    "end_sec": t_end,
                    "type": "digital_zero_silence",
                    "title": "Acoustic Silence Cutoff",
                    "description": "Unnatural silence floor with 0 ambient decay or breath aspiration.",
                    "severity": "high"
                })

    # Check for high frequency shelf attenuation (upper 25% bins essentially empty while speech active)
    speech_cols = np.where(col_max > 0.4)[0]
    if len(speech_cols) > 5:
        upper_energy = np.mean(norm_spec[int(target_freq_bins * 0.75):, speech_cols])
        if upper_energy < 0.08:
            anomalies.append({
                "start_sec": 0.0,
                "end_sec": round(duration, 2),
                "type": "hf_spectral_cutoff",
                "title": "Vocoder Bandwidth Shelf",
                "description": "Steep attenuation above 6.5 kHz typical of neural vocoders trained on 22/24kHz.",
                "severity": "medium"
            })

    return {
        "duration_sec": round(duration, 2),
        "freq_bins": target_freq_bins,
        "time_bins": norm_spec.shape[1],
        "matrix": matrix,
        "anomalies": anomalies
    }
