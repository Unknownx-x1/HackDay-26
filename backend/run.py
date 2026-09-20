import os
import sys

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn
from backend.app.main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Voiceprint AI Audio Forensic API on http://0.0.0.0:{port} ...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)
