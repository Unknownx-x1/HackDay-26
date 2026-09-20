#!/usr/bin/env bash
# build.sh — Render.com build script
# Installs Python deps + builds the React frontend in one step

set -o errexit

# 1. Python backend dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 2. Frontend build (Node.js is available on Render)
cd frontend
npm install
npm run build
cd ..

# 3. Generate demo samples + train classifier (if not already present)
python -c "
import os, sys
sys.path.insert(0, '.')
samples_dir = os.path.join('backend', 'data', 'samples')
if not os.path.exists(samples_dir) or len(os.listdir(samples_dir)) < 3:
    print('Generating demo dataset and training classifier...')
    from backend.app.core.dataset_generator import build_demo_dataset
    build_demo_dataset()
else:
    print(f'Samples already exist ({len(os.listdir(samples_dir))} files), skipping generation.')
"

echo "Build complete."
