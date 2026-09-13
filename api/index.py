import os
import sys
from pathlib import Path

# Add project root, api, and backend directories to sys.path
api_dir = Path(__file__).resolve().parent
root_dir = api_dir.parent
backend_dir = root_dir / "backend"

for p in [str(api_dir), str(backend_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Top-level import and assignments for Vercel Serverless Function builder
from app.main import app

application = app
handler = app
