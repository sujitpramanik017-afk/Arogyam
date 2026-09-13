import os
import sys
from pathlib import Path

# Add project root, api, and backend directories to sys.path
root_dir = Path(__file__).resolve().parent.parent
api_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"

for path_dir in [str(api_dir), str(backend_dir), str(root_dir)]:
    if path_dir not in sys.path:
        sys.path.insert(0, path_dir)

# Import the FastAPI application instance for Vercel
try:
    from app.main import app
except ImportError:
    from api.app.main import app

# Expose app for Vercel ASGI / WSGI Serverless Function handler
# Vercel's @vercel/python builder automatically locates `app`
