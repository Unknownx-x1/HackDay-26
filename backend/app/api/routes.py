import os
import io
import base64
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, Response
from typing import Optional

from ..core.audio_processor import load_audio
from ..core.feature_extractor import extract_acoustic_features, generate_spectrogram_data
from ..core.classifier import VoiceprintClassifier
from ..core.dataset_generator import get_demo_manifest, SAMPLES_DIR

router = APIRouter()
classifier = VoiceprintClassifier()

@router.get("/samples")
def list_samples():
    """Returns list of curated test audio clips for hackathon stage demos."""
    manifest = get_demo_manifest()
    return {"status": "success", "samples": manifest}

@router.get("/sample/{sample_id}/audio")
def get_sample_audio(sample_id: str):
    """Streams audio file for a given sample."""
    manifest = {s["id"]: s["filename"] for s in get_demo_manifest()}
    filename = manifest.get(sample_id)
    if not filename:
        raise HTTPException(status_code=404, detail="Sample not found")
    filepath = os.path.join(SAMPLES_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file missing on server")
    return FileResponse(filepath, media_type="audio/wav", filename=filename)

@router.post("/analyze")
async def analyze_audio(
    file: Optional[UploadFile] = File(None),
    sample_id: Optional[str] = Form(None),
    audio_base64: Optional[str] = Form(None)
):
    """
    Main analysis endpoint: extracts forensic signals, runs calibrated classifier,
    computes 2D spectrogram matrix, and generates plain-English diagnostic evidence.
    """
    audio_bytes = None

    if file is not None:
        audio_bytes = await file.read()
    elif sample_id:
        manifest = {s["id"]: s["filename"] for s in get_demo_manifest()}
        filename = manifest.get(sample_id)
        if not filename:
            raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found")
        filepath = os.path.join(SAMPLES_DIR, filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Sample file missing on server")
        with open(filepath, "rb") as f:
            audio_bytes = f.read()
    elif audio_base64:
        try:
            # Strip data URL header if present
            if "," in audio_base64:
                audio_base64 = audio_base64.split(",")[1]
            audio_bytes = base64.b64decode(audio_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 audio data: {e}")
    else:
        raise HTTPException(status_code=400, detail="Must provide 'file', 'sample_id', or 'audio_base64'")

    if not audio_bytes or len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio payload is empty or invalid.")

    try:
        # 1. Preprocess & resample to 16kHz mono
        y, sr = load_audio(audio_bytes, target_sr=16000)

        # 2. Extract 4 acoustic signal pillars
        features = extract_acoustic_features(y, sr)

        # 3. Generate 2D interactive spectrogram matrix
        spectrogram = generate_spectrogram_data(y, sr)

        # 4. Calibrated ML classification & interpretable explanations
        prediction = classifier.predict(features)

        return {
            "status": "success",
            "result": {
                "verdict": prediction["verdict"],
                "ai_probability": prediction["ai_probability"],
                "human_probability": prediction["human_probability"],
                "confidence_score": prediction["confidence_score"],
                "risk_level": prediction["risk_level"],
                "explanations": prediction["explanations"],
                "features": features,
                "spectrogram": spectrogram
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@router.post("/compare")
async def compare_clips(
    target_sample_id: Optional[str] = Form(None),
    target_file: Optional[UploadFile] = File(None),
    ref_sample_id: Optional[str] = Form("human_casual_speech"),
    ref_file: Optional[UploadFile] = File(None)
):
    """
    Side-by-side comparison endpoint: compares target clip against a known human reference clip.
    Generates spectrogram diff and delta metrics (e.g. Jitter reduction ratio, HNR divergence).
    """
    # Load target audio
    if target_file:
        target_bytes = await target_file.read()
    elif target_sample_id:
        manifest = {s["id"]: s["filename"] for s in get_demo_manifest()}
        filename = manifest.get(target_sample_id)
        filepath = os.path.join(SAMPLES_DIR, filename)
        with open(filepath, "rb") as f:
            target_bytes = f.read()
    else:
        raise HTTPException(status_code=400, detail="Target clip required")

    # Load reference audio
    if ref_file:
        ref_bytes = await ref_file.read()
    else:
        manifest = {s["id"]: s["filename"] for s in get_demo_manifest()}
        filename = manifest.get(ref_sample_id, "human_casual_speech.wav")
        filepath = os.path.join(SAMPLES_DIR, filename)
        with open(filepath, "rb") as f:
            ref_bytes = f.read()

    y_target, sr = load_audio(target_bytes)
    y_ref, _ = load_audio(ref_bytes)

    feats_target = extract_acoustic_features(y_target, sr)
    feats_ref = extract_acoustic_features(y_ref, sr)

    spec_target = generate_spectrogram_data(y_target, sr)
    spec_ref = generate_spectrogram_data(y_ref, sr)

    pred_target = classifier.predict(feats_target)
    pred_ref = classifier.predict(feats_ref)

    # Compute comparative deltas
    jit_target = feats_target.get("jitter_local_pct", 0.001)
    jit_ref = feats_ref.get("jitter_local_pct", 0.001)
    jitter_ratio = round(jit_ref / max(jit_target, 0.001), 1)

    shim_target = feats_target.get("shimmer_local_pct", 0.001)
    shim_ref = feats_ref.get("shimmer_local_pct", 0.001)
    shimmer_ratio = round(shim_ref / max(shim_target, 0.001), 1)

    hnr_diff = round(feats_target.get("hnr_mean_db", 0) - feats_ref.get("hnr_mean_db", 0), 1)

    return {
        "status": "success",
        "target": {
            "verdict": pred_target["verdict"],
            "ai_probability": pred_target["ai_probability"],
            "features": feats_target,
            "spectrogram": spec_target
        },
        "reference": {
            "verdict": pred_ref["verdict"],
            "ai_probability": pred_ref["ai_probability"],
            "features": feats_ref,
            "spectrogram": spec_ref
        },
        "comparison": {
            "jitter_ratio": f"Target has {jitter_ratio}× less pitch jitter than Reference",
            "shimmer_ratio": f"Target has {shimmer_ratio}× less amplitude shimmer than Reference",
            "hnr_delta": f"{hnr_diff:+} dB HNR disparity",
            "summary": f"Target speech exhibits {jitter_ratio}× excessive pitch regularity and {shimmer_ratio}× amplitude suppression compared to natural human reference voice."
        }
    }
