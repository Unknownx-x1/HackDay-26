import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.routes import router as api_router

app = FastAPI(
    title="Voiceprint AI Audio Forensic API",
    description="Real-Time Interpretable Synthetic Voice & Deepfake Screening Engine",
    version="1.0.0"
)

# Enable CORS for local dev servers and frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Voiceprint Forensic Screening API",
        "features": ["Praat Parselmouth", "Librosa", "LogisticRegression", "Interpretable Explainer"]
    }

# Serve built frontend if available (MUST BE MOUNTED LAST)
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
else:
    @app.get("/")
    def root_info():
        return {
            "message": "Voiceprint Forensic Screening API is running.",
            "frontend": "Run 'npm run dev' in frontend/ or build frontend with 'npm run build'",
            "docs": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
