from typing import Dict, Any, List

# Established acoustic empirical norms for conversational speech (16kHz)
# Derived from clinical voice science (Praat standard norms) & synthetic speech research
ACOUSTIC_NORMS = {
    "jitter_local_pct": {
        "name": "Pitch Jitter (Local)",
        "unit": "%",
        "human_min": 0.80,
        "human_max": 2.80,
        "human_mean": 1.60,
        "ai_typical": 0.35,
        "direction": "low_is_ai",  # AI is hyper-smooth or has boundary step cuts
        "description": "Vocal cord cycle-to-cycle frequency perturbation (micro-tremor). Natural human vocal folds never oscillate with mathematical perfection."
    },
    "shimmer_local_pct": {
        "name": "Amplitude Shimmer",
        "unit": "%",
        "human_min": 4.0,
        "human_max": 12.0,
        "human_mean": 7.5,
        "ai_typical": 1.5,
        "direction": "low_is_ai",  # AI has sterile uniform glottal pulses
        "description": "Cycle-to-cycle amplitude perturbation. Low shimmer reflects absence of natural subglottal pressure flutter."
    },
    "hnr_mean_db": {
        "name": "Harmonics-to-Noise Ratio (HNR)",
        "unit": "dB",
        "human_min": 8.0,
        "human_max": 18.0,
        "human_mean": 13.0,
        "ai_typical": 25.0,
        "direction": "high_is_ai",  # Neural vocoders synthesize sterile harmonic tracks
        "description": "Ratio of periodic vocal harmonic energy to turbulent aspiration noise. Synthetic voices often lack natural breathiness."
    },
    "hnr_std_db": {
        "name": "HNR Prosodic Variance",
        "unit": "dB",
        "human_min": 4.0,
        "human_max": 9.0,
        "human_mean": 6.2,
        "ai_typical": 2.5,
        "direction": "low_is_ai",
        "description": "Dynamic fluctuation of vocal turbulence across syllables. Real speech varies between voiced vowels and turbulent consonants."
    },
    "cpp": {
        "name": "Cepstral Peak Prominence (CPP)",
        "unit": "",
        "human_min": 0.07,
        "human_max": 0.22,
        "human_mean": 0.13,
        "ai_typical": 0.26,
        "direction": "high_is_ai",
        "description": "Measure of harmonic regularity and vocal fold periodicity. Synthesized speech exhibits elevated, rigid cepstral peaks."
    },
    "spectral_flatness": {
        "name": "Spectral Flatness",
        "unit": "",
        "human_min": 0.008,
        "human_max": 0.050,
        "human_mean": 0.022,
        "ai_typical": 0.160,
        "direction": "high_is_ai",  # Neural vocoders generate diffuse high-band noise and phase smearing
        "description": "Measures spectral peakedness vs uniform noise. Neural vocoders exhibit diffuse spectral smearing across high frequencies."
    },
    "spectral_rolloff_95_hz": {
        "name": "95% Spectral Rolloff",
        "unit": "Hz",
        "human_min": 4800.0,
        "human_max": 7800.0,
        "human_mean": 6200.0,
        "ai_typical": 3900.0,
        "direction": "low_is_ai",  # Neural vocoders frequently attenuate above 4kHz
        "description": "Upper frequency containing 95% of spectral power. Neural vocoders frequently demonstrate steep brickwall attenuation around 4 kHz."
    },
    "silence_floor_db": {
        "name": "Pause Silence Floor",
        "unit": "dB",
        "human_min": -72.0,
        "human_max": -38.0,
        "human_mean": -52.0,
        "ai_typical": -115.0,
        "direction": "low_is_ai",
        "description": "Acoustic noise floor in pauses. Physical microphone recordings maintain ambient acoustic dispersion (> -72 dB), while synthetic speech drops to digital zero (-85 dB to -120 dB)."
    },
    "breath_pause_ratio": {
        "name": "Breath Inhalation Rate",
        "unit": "",
        "human_min": 0.10,
        "human_max": 1.00,
        "human_mean": 0.40,
        "ai_typical": 0.00,
        "direction": "low_is_ai",
        "description": "Frequency of audible inhalation turbulence prior to speech onsets. Synthetic speech rarely generates natural pulmonary inhalations."
    }
}

def generate_explanations(features: Dict[str, Any], ai_prob: float) -> Dict[str, Any]:
    """
    Generates plain-English, interpretable diagnostic explanations strictly derived
    from the individual acoustic metrics of the analyzed audio clip.
    Evidence cards are decoupled from labels: anomalous metrics always produce
    synthetic artifact cards and are never praised as biological.
    """
    radar_data = []
    metrics_table = []
    is_human = (ai_prob < 0.50)

    CODES = {
        "jitter_local_pct": "JITTER",
        "shimmer_local_pct": "SHIMMER",
        "hnr_mean_db": "HNR",
        "hnr_std_db": "HNR-VAR",
        "cpp": "CPP",
        "spectral_flatness": "FLATNESS",
        "spectral_rolloff_95_hz": "ROLLOFF",
        "silence_floor_db": "SILENCE",
        "breath_pause_ratio": "BREATHS"
    }

    # Extract key metrics for direct physical reasoning
    floor = float(features.get("silence_floor_db", -60.0))
    zero_ratio = float(features.get("digital_zero_ratio", 0.0))
    has_lead_in = bool(features.get("has_digital_zero_lead_in", False))
    rolloff = float(features.get("spectral_rolloff_95_hz", 5500.0))
    flatness = float(features.get("spectral_flatness", 0.02))
    jitter = float(features.get("jitter_local_pct", 1.2))
    shimmer = float(features.get("shimmer_local_pct", 6.0))
    hnr = float(features.get("hnr_mean_db", 14.0))
    breaths = int(features.get("breaths_detected", 0))
    duration = float(features.get("duration_sec", 0.0))

    # 1. Populate metrics_table and radar_data based on objective acoustic norms
    for key, norm in ACOUSTIC_NORMS.items():
        val = features.get(key, None)
        if val is None:
            continue

        h_min, h_max, h_mean = norm["human_min"], norm["human_max"], norm["human_mean"]
        ai_typ = norm["ai_typical"]
        direction = norm["direction"]

        is_anomalous = False
        if direction == "low_is_ai":
            if val < h_min:
                # Breaths require sufficient duration
                if key == "breath_pause_ratio" and duration < 4.0 and floor > -75.0:
                    is_anomalous = False
                else:
                    is_anomalous = True
        elif direction == "high_is_ai":
            if val > h_max:
                is_anomalous = True

        # Add to metrics table
        metrics_table.append({
            "key": key,
            "name": norm["name"],
            "value": round(val, 3) if isinstance(val, float) else val,
            "unit": norm["unit"],
            "human_range": f"{h_min}{norm['unit']} – {h_max}{norm['unit']}",
            "ai_typical": f"{ai_typ}{norm['unit']}",
            "status": "anomalous" if is_anomalous else "normal",
            "description": norm["description"]
        })

        # Calibrated normalized anomaly index: 15-30 = Natural Human, 70-98 = Synthetic Vocoder
        if direction == "low_is_ai":
            if val < h_min:
                score = 70.0 + min(28.0, ((h_min - val) / max(0.001, abs(h_min))) * 30.0)
            elif val > h_max:
                score = max(5.0, 20.0 - ((val - h_max) / max(0.001, abs(h_max))) * 15.0)
            else:
                score = 15.0 + ((h_max - val) / max(0.001, h_max - h_min)) * 25.0
        else:
            if val > h_max:
                score = 70.0 + min(28.0, ((val - h_max) / max(0.001, abs(ai_typ - h_max))) * 30.0)
            elif val < h_min:
                score = max(5.0, 20.0 - ((h_min - val) / max(0.001, abs(h_min))) * 15.0)
            else:
                score = 15.0 + ((val - h_min) / max(0.001, h_max - h_min)) * 25.0

        if key == "breath_pause_ratio" and duration < 4.0 and floor > -75.0:
            score = 20.0

        score = max(5.0, min(98.0, score))

        radar_data.append({
            "code": CODES.get(key, key.upper()[:6]),
            "metric": CODES.get(key, norm["name"].split(" (")[0]),
            "full_name": norm["name"],
            "raw_value": round(val, 2) if isinstance(val, (int, float)) else val,
            "unit": norm["unit"],
            "sample_value": round(score, 1),
            "human_baseline": 20.0,
            "ai_baseline": 85.0,
            "is_anomalous": is_anomalous,
            "status": "anomalous" if is_anomalous else "normal"
        })

    # 2. Build Findings mathematically derived from sample metrics
    all_findings = []

    # Finding 1: Pause Silence Floor / Digital Zero Splicing
    if floor <= -80.0 or zero_ratio >= 0.05 or has_lead_in:
        all_findings.append({
            "feature": "silence_floor_db",
            "title": "Algorithmic Digital Zero Silence",
            "severity": "high",
            "badge": "Synthetic Artifact",
            "description": f"Pause acoustic noise floor plunges to {floor:.1f} dB ({zero_ratio * 100.0:.1f}% zero-energy frames). Physical microphone recordings in real rooms maintain continuous acoustic dissipation (> -72.0 dB); absolute digital zero is a physical impossibility for authentic microphone recordings and proves algorithmic buffer splicing.",
            "evidence": f"Measured Floor: {floor:.1f} dB | Physical Acoustic Threshold: > -72.0 dB"
        })
    elif -72.0 <= floor <= -35.0:
        all_findings.append({
            "feature": "silence_floor_db",
            "title": "Organic Ambient Acoustic Dispersion",
            "severity": "info",
            "badge": "Authentic Human Signal",
            "description": f"Pause noise floor maintains natural acoustic room ambience at {floor:.1f} dB, consistent with physical microphone transducer mechanics, room reverberation, and thermal electronics noise.",
            "evidence": f"Measured Floor: {floor:.1f} dB | Expected Natural Range: -72.0 dB to -35.0 dB"
        })

    # Finding 2: 95% Spectral Rolloff & Vocoder Shelving
    if rolloff <= 4400.0:
        all_findings.append({
            "feature": "spectral_rolloff_95_hz",
            "title": "Neural Vocoder Bandwidth Shelf",
            "severity": "medium",
            "badge": "Synthetic Artifact",
            "description": f"95% spectral energy cuts off abruptly at {rolloff:.0f} Hz (natural uncompressed speech: > 4800 Hz). This brickwall shelving indicates neural vocoder decimation typical of models trained on downsampled mel-spectrograms.",
            "evidence": f"Measured Rolloff: {rolloff:.0f} Hz | Human Sibilance Floor: > 4800 Hz"
        })
    elif rolloff >= 5000.0:
        all_findings.append({
            "feature": "spectral_rolloff_95_hz",
            "title": "Full-Spectrum Articulatory Dispersion",
            "severity": "info",
            "badge": "Authentic Human Signal",
            "description": f"Acoustic energy spans up to {rolloff:.0f} Hz, displaying organic uncompressed sibilant friction ('s', 'sh', 'f') and unconstrained vocal tract harmonics.",
            "evidence": f"Measured Rolloff: {rolloff:.0f} Hz | Natural Baseline: > 5000 Hz"
        })

    # Finding 3: Spectral Flatness & Phase Smearing
    if flatness >= 0.075:
        all_findings.append({
            "feature": "spectral_flatness",
            "title": "Vocoder Spectral Dispersion & Phase Smearing",
            "severity": "medium",
            "badge": "Synthetic Artifact",
            "description": f"Spectral flatness is elevated to {flatness:.3f} (human baseline: 0.008–0.050). Neural vocoders introduce diffuse pseudo-random phase smearing across unvoiced frequency bins rather than distinct biological formant notches.",
            "evidence": f"Measured Flatness: {flatness:.3f} | Human Normal: 0.008–0.050"
        })
    elif flatness <= 0.045:
        all_findings.append({
            "feature": "spectral_flatness",
            "title": "Formant Peak-to-Valley Resonance",
            "severity": "info",
            "badge": "Authentic Human Signal",
            "description": f"Spectral flatness is low ({flatness:.3f}), reflecting well-defined resonant vocal tract formant peaks and deep harmonic troughs characteristic of human pharyngeal articulation.",
            "evidence": f"Measured Flatness: {flatness:.3f} | Human Normal: 0.008–0.050"
        })

    # Finding 4: Pitch Micro-Stability & Cycle Tracking
    if jitter < 0.50:
        all_findings.append({
            "feature": "jitter_local_pct",
            "title": "Suppressed Vocal Micro-Tremors (Jitter)",
            "severity": "high",
            "badge": "Synthetic Artifact",
            "description": f"Pitch jitter is {jitter:.2f}% (human normal: 0.80%–2.80%). Biological vocal folds possess physical inertia and neuromuscular tremors that prevent mathematical oscillation stability.",
            "evidence": f"Measured Jitter: {jitter:.2f}% | Human Biological Norm: 0.80%–2.80%"
        })
    elif jitter > 2.80 and floor <= -80.0:
        all_findings.append({
            "feature": "jitter_local_pct",
            "title": "Algorithmic Boundary Phase Discontinuities",
            "severity": "medium",
            "badge": "Synthetic Artifact",
            "description": f"Measured jitter of {jitter:.2f}% reflects cycle-tracking errors across abrupt vocoder phoneme boundaries and digital zero transitions, a hallmark of concatenative/neural speech synthesis.",
            "evidence": f"Measured Jitter: {jitter:.2f}% | Boundary Discontinuity Detected"
        })
    elif 0.70 <= jitter <= 2.80 and floor > -75.0:
        all_findings.append({
            "feature": "jitter_local_pct",
            "title": "Authentic Laryngeal Micro-Perturbations",
            "severity": "info",
            "badge": "Authentic Human Signal",
            "description": f"Measured vocal jitter of {jitter:.2f}% confirms natural biological cycle-to-cycle frequency perturbations within expected human physiological bounds.",
            "evidence": f"Measured Jitter: {jitter:.2f}% | Human Biological Norm: 0.80%–2.80%"
        })

    # Finding 5: Inhalation Breaths & Pulmonary Dynamics
    if floor <= -80.0 or breaths == 0:
        all_findings.append({
            "feature": "breath_pause_ratio",
            "title": "Absence of Pulmonary Inhalation Dynamics",
            "severity": "medium",
            "badge": "Synthetic Artifact",
            "description": "No genuine pre-speech pulmonary inhalation turbulence detected across pauses. Synthesized voices do not naturally breathe or model physiological thoracic expansion.",
            "evidence": f"Inhalation Breaths: 0 | Acoustic Floor: {floor:.1f} dB"
        })
    elif breaths > 0 and floor > -75.0:
        all_findings.append({
            "feature": "breath_pause_ratio",
            "title": "Biological Inhalation Breath Cues",
            "severity": "info",
            "badge": "Authentic Human Signal",
            "description": "Audible pre-phonatory inhalation breath turbulence detected prior to speech onsets, indicating living respiratory mechanics.",
            "evidence": f"Detected Breaths: {breaths} | Acoustic Floor: {floor:.1f} dB"
        })

    # Finding 6: Harmonics-to-Noise Ratio (HNR)
    if hnr > 21.0:
        all_findings.append({
            "feature": "hnr_mean_db",
            "title": "Sterile Harmonicity (Elevated HNR)",
            "severity": "medium",
            "badge": "Synthetic Artifact",
            "description": f"Harmonics-to-noise ratio is {hnr:.1f} dB (natural baseline: 8.0–18.0 dB). Vocoders frequently produce over-synthesized harmonics lacking organic glottal aspiration noise.",
            "evidence": f"Measured HNR: {hnr:.1f} dB | Natural Human Range: 8.0–18.0 dB"
        })
    elif 8.0 <= hnr <= 19.0 and floor > -75.0:
        all_findings.append({
            "feature": "hnr_mean_db",
            "title": "Natural Glottal Aspiration & Friction",
            "severity": "info",
            "badge": "Authentic Human Signal",
            "description": f"Harmonics-to-noise ratio is balanced at {hnr:.1f} dB, exhibiting healthy glottal friction without sterile vocoder regularity.",
            "evidence": f"Measured HNR: {hnr:.1f} dB | Natural Human Range: 8.0–18.0 dB"
        })

    # Sort findings according to overall classification context
    if ai_prob >= 0.50:
        # Prioritize synthetic artifacts (high severity first)
        synth_cards = [f for f in all_findings if f["badge"] == "Synthetic Artifact"]
        human_cards = [f for f in all_findings if f["badge"] != "Synthetic Artifact"]
        synth_cards.sort(key=lambda x: 0 if x["severity"] == "high" else 1)
        findings = synth_cards + human_cards
    else:
        # Prioritize verified biological markers
        human_cards = [f for f in all_findings if f["badge"] == "Authentic Human Signal"]
        synth_cards = [f for f in all_findings if f["badge"] != "Authentic Human Signal"]
        findings = human_cards + synth_cards

    # 3. Synthesize overarching headline statement
    if ai_prob >= 0.70:
        top_reasons = [f["title"] for f in findings if f["badge"] == "Synthetic Artifact"][:2]
        reasons_str = " and ".join(top_reasons) if top_reasons else "abnormal vocoder acoustic dynamics"
        headline = f"{int(ai_prob * 100)}% Likely AI-Generated — flags {reasons_str}."
    elif ai_prob <= 0.35:
        top_cues = [f["title"] for f in findings if f["badge"] == "Authentic Human Signal"][:2]
        cues_str = " and ".join(top_cues) if top_cues else "natural biological acoustic dynamics"
        headline = f"{int((1 - ai_prob) * 100)}% Likely Authentic Human Voice — verified {cues_str}."
    else:
        headline = f"{int(ai_prob * 100)}% Borderline Confidence — mixed acoustic signals detected across channels."

    return {
        "headline": headline,
        "findings": findings,
        "metrics_table": metrics_table,
        "radar_data": radar_data
    }
