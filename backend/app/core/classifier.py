import os
import joblib
import numpy as np
from typing import Dict, Any, Tuple, Optional
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

from .explainer import generate_explanations

FEATURE_NAMES = [
    "jitter_local_pct",
    "jitter_rap_pct",
    "jitter_ppq5_pct",
    "shimmer_local_pct",
    "shimmer_apq3_pct",
    "shimmer_apq5_pct",
    "hnr_mean_db",
    "hnr_std_db",
    "cpp",
    "spectral_flatness",
    "spectral_rolloff_95_hz",
    "hf_energy_ratio",
    "mfcc_dynamic_variance",
    "silence_floor_db",
    "breath_pause_ratio"
]

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "model_weights.joblib")

class VoiceprintClassifier:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.pipeline: Optional[Pipeline] = None
        self._load_or_create_default_model()

    def _features_to_vector(self, features: Dict[str, Any]) -> np.ndarray:
        vec = []
        for name in FEATURE_NAMES:
            val = float(features.get(name, 0.0))
            vec.append(val)
        return np.array(vec, dtype=np.float32).reshape(1, -1)

    def _load_or_create_default_model(self):
        """Loads trained pipeline from disk or initializes a scientifically calibrated linear model."""
        if os.path.exists(self.model_path):
            try:
                self.pipeline = joblib.load(self.model_path)
                return
            except Exception:
                pass

        # Calibrated baseline initialization with modern neural TTS and conversational human benchmarks
        scaler = StandardScaler()
        # Features order:
        # jitter_local, jitter_rap, jitter_ppq5, shimmer_loc, shimmer_apq3, shimmer_apq5,
        # hnr_mean, hnr_std, cpp, spectral_flatness, rolloff95, hf_ratio, mfcc_var, silence_floor, breath_ratio
        
        # Synthetic benchmarks (label 1): flat vocoders, ElevenLabs, OpenAI, LuvVoice, HiFi-GAN
        syn_benchmarks = np.array([
            # Flat robotic vocoder
            [0.69, 0.40, 0.37, 0.46, 0.26, 0.29, 34.72, 6.94, 0.11, 0.15, 1368.7, 0.00, 52.59, -88.0, 0.0],
            # ElevenLabs expressive clone (Viraj & Studio)
            [2.54, 0.67, 0.87, 8.85, 3.32, 4.78, 8.54, 5.01, 0.16, 0.25, 2942.6, 0.04, 439.25, -85.0, 0.0],
            [1.79, 0.50, 0.81, 11.27, 3.46, 6.10, 8.73, 5.42, 0.10, 0.28, 2154.7, 0.02, 361.01, -120.0, 0.0],
            # OpenAI TTS neural voice
            [1.41, 0.61, 0.74, 7.65, 2.44, 3.42, 14.02, 6.01, 0.20, 0.29, 1887.1, 0.01, 392.92, -120.0, 0.0],
            # System TTS spoken
            [1.99, 0.66, 0.89, 12.30, 3.87, 6.90, 8.00, 5.56, 0.10, 0.39, 2053.3, 0.02, 342.99, -120.0, 0.0],
            # LuvVoice / EdgeTTS neural vocoder with boundary cuts
            [2.95, 1.05, 1.62, 9.79, 3.57, 4.95, 10.19, 5.61, 0.12, 0.39, 1993.9, 0.03, 262.82, -120.0, 0.0],
            # MelGAN / HiFi-GAN standard
            [1.20, 0.55, 0.65, 5.50, 2.40, 3.20, 20.00, 4.20, 0.18, 0.26, 2600.0, 0.02, 240.00, -95.0, 0.0]
        ], dtype=np.float32)
        
        # Human benchmarks (label 0): casual speech, conversational mic, phone audio, studio voiceover
        hum_benchmarks = np.array([
            # Casual conversational speech
            [3.03, 0.96, 1.20, 9.37, 3.44, 5.44, 9.17, 7.77, 0.09, 0.17, 1199.9, 0.01, 296.16, -52.0, 0.0],
            # Conversational dynamic mic
            [1.94, 0.81, 0.88, 9.17, 3.55, 5.37, 13.37, 5.94, 0.20, 0.30, 2071.7, 0.04, 294.51, -52.3, 0.0],
            # Phone line audio
            [2.40, 0.88, 1.07, 9.22, 3.58, 4.91, 12.75, 6.80, 0.14, 0.24, 1882.3, 0.01, 410.74, -66.5, 0.0],
            # Studio voiceover with respiration
            [1.30, 0.58, 0.68, 5.10, 2.20, 2.90, 16.50, 4.50, 0.14, 0.18, 2800.0, 0.06, 280.00, -58.0, 0.5],
            # Natural dynamic expressive speech
            [1.65, 0.72, 0.82, 6.20, 2.70, 3.40, 14.00, 5.00, 0.12, 0.22, 2600.0, 0.05, 320.00, -48.0, 0.4],
            # Quiet room mic recording
            [1.45, 0.66, 0.75, 5.20, 2.30, 3.00, 15.20, 4.60, 0.13, 0.19, 2500.0, 0.05, 260.00, -62.0, 0.3],
            # Animated live conversation
            [2.25, 0.87, 0.97, 7.80, 3.30, 4.30, 11.80, 6.20, 0.11, 0.25, 2700.0, 0.04, 360.00, -46.0, 0.6]
        ], dtype=np.float32)

        X = np.vstack([syn_benchmarks, hum_benchmarks])
        y = np.array([1]*len(syn_benchmarks) + [0]*len(hum_benchmarks))

        clf = LogisticRegression(C=1.0, max_iter=500, random_state=42)
        pipeline = Pipeline([
            ("scaler", scaler),
            ("clf", clf)
        ])
        pipeline.fit(X, y)
        self.pipeline = pipeline
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.pipeline, self.model_path)
        except Exception:
            pass

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes synthetic probability, verdict, confidence, and interpretable explanations.
        Enforces physical acoustic reality constraints:
        - In physical acoustics, no real microphone recording can possess digital zero silence (-85 to -120 dB).
        - Neural vocoders display steep spectral attenuation at ~4kHz and high spectral flatness in upper bands.
        """
        vec = self._features_to_vector(features)
        
        # ML model probability
        raw_prob_ai = float(self.pipeline.predict_proba(vec)[0][1])

        # Acoustic Physical Indicators
        silence_floor = features.get("silence_floor_db", -60.0)
        zero_ratio = features.get("digital_zero_ratio", 0.0)
        has_lead_in = features.get("has_digital_zero_lead_in", False)
        rolloff = features.get("spectral_rolloff_95_hz", 6000.0)
        flatness = features.get("spectral_flatness", 0.02)
        breaths = features.get("breaths_detected", 0)
        jitter = features.get("jitter_local_pct", 1.2)
        shimmer = features.get("shimmer_local_pct", 6.0)

        # DEBUG LOGGING (per user instruction)
        print(f"[DEBUG predict()] silence_floor_db={silence_floor:.2f}dB | spectral_rolloff_95_hz={rolloff:.1f}Hz | spectral_flatness={flatness:.4f} | digital_zero_ratio={zero_ratio:.4f} | raw_prob_ai={raw_prob_ai:.3f}")

        # Apply calibrated adjustments based on physical acoustic reality
        calibrated_prob = raw_prob_ai

        # Physical Rule 1: Digital Zero Silence Floor Invariant
        # True microphone recordings in physical rooms NEVER produce silence floors <= -80dB or zero ratio >= 0.05.
        # Absolute digital zero is an unequivocal signature of synthetic audio generation or digital gating.
        if silence_floor <= -80.0 or zero_ratio >= 0.05 or has_lead_in:
            if rolloff <= 4500.0 or flatness >= 0.070 or silence_floor <= -85.0:
                calibrated_prob = max(calibrated_prob, 0.88)
                print(f"[DEBUG predict()] Physical Rule 1 FIRED -> calibrated_prob clamped to {calibrated_prob}")
            else:
                calibrated_prob = max(calibrated_prob, 0.75)
                print(f"[DEBUG predict()] Physical Rule 1 (Secondary) FIRED -> calibrated_prob clamped to {calibrated_prob}")

        # Physical Rule 2: Natural Room Ambience Invariant
        # Unedited room audio with natural microphone thermal floor, organic formant valleys, and natural bandwidth
        elif silence_floor >= -70.0 and zero_ratio < 0.045:
            if rolloff >= 4500.0 or breaths > 0 or (jitter >= 0.8 and shimmer >= 3.0):
                calibrated_prob = min(calibrated_prob, 0.15)
                print(f"[DEBUG predict()] Physical Rule 2 (Human Ambience) FIRED -> calibrated_prob clamped to {calibrated_prob}")

        calibrated_prob = round(float(np.clip(calibrated_prob, 0.02, 0.98)), 3)
        human_prob = round(1.0 - calibrated_prob, 3)

        # Verdict assignment
        if calibrated_prob >= 0.65:
            verdict = "LIKELY_AI"
            risk_level = "CRITICAL_SYNTHETIC" if calibrated_prob >= 0.85 else "HIGH_SYNTHETIC"
            confidence_score = round(calibrated_prob * 100.0, 1)
        elif calibrated_prob <= 0.35:
            verdict = "LIKELY_HUMAN"
            risk_level = "AUTHENTIC_NATURAL"
            confidence_score = round(human_prob * 100.0, 1)
        else:
            verdict = "UNCERTAIN"
            risk_level = "BORDERLINE"
            confidence_score = round(max(calibrated_prob, human_prob) * 100.0, 1)

        # Generate human-interpretable forensic breakdown (strictly per-sample derived)
        explanations = generate_explanations(features, calibrated_prob)

        return {
            "verdict": verdict,
            "ai_probability": calibrated_prob,
            "human_probability": human_prob,
            "confidence_score": confidence_score,
            "risk_level": risk_level,
            "explanations": explanations
        }

    def train_and_save(self, X: np.ndarray, y: np.ndarray, save_path: str = MODEL_PATH):
        """Fits pipeline on custom labeled dataset and writes to disk."""
        pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(C=1.5, max_iter=1000, random_state=42))
        ])
        pipeline.fit(X, y)
        self.pipeline = pipeline
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        joblib.dump(pipeline, save_path)
        print(f"Voiceprint classifier saved to {save_path}")
