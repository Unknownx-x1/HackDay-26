import io
import numpy as np
import soundfile as sf
import librosa
from typing import Tuple, Union, BinaryIO

TARGET_SR = 16000

def load_audio(
    source: Union[str, bytes, BinaryIO],
    target_sr: int = TARGET_SR,
    max_duration: float = 60.0
) -> Tuple[np.ndarray, int]:
    """
    Loads audio from a file path, raw bytes, or file-like object.
    Standardizes output to 1D float32 mono array at target_sr (default 16kHz).
    """
    if isinstance(source, bytes):
        source = io.BytesIO(source)

    try:
        # soundfile is fast and handles wav, ogg, flac, modern mp3
        y, sr = sf.read(source, dtype='float32')
    except Exception:
        # Fallback to librosa if soundfile fails on specific container
        if hasattr(source, 'seek'):
            source.seek(0)
        y, sr = librosa.load(source, sr=None, mono=False)

    # Convert to mono if multi-channel
    if y.ndim > 1:
        y = np.mean(y, axis=1 if y.shape[0] > y.shape[1] else 0)

    # Resample to target_sr if needed
    if sr != target_sr:
        y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    # Ensure 1D float32
    y = np.asarray(y, dtype=np.float32).flatten()

    # Cap maximum duration to avoid huge payloads
    max_samples = int(max_duration * sr)
    if len(y) > max_samples:
        y = y[:max_samples]

    # Normalize audio level (peak & RMS)
    y = normalize_audio(y)

    return y, sr

def normalize_audio(y: np.ndarray, target_peak: float = 0.95) -> np.ndarray:
    """Normalizes peak amplitude to target_peak while avoiding divide-by-zero."""
    peak = np.max(np.abs(y))
    if peak > 1e-6:
        y = (y / peak) * target_peak
    return y

def trim_silence(y: np.ndarray, sr: int = TARGET_SR, top_db: float = 35.0) -> np.ndarray:
    """Trims leading and trailing silence with safety margin."""
    trimmed, _ = librosa.effects.trim(y, top_db=top_db, frame_length=512, hop_length=128)
    if len(trimmed) < int(0.2 * sr):  # If trimmed everything, keep original
        return y
    return trimmed
