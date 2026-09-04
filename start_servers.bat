@echo off
echo =========================================================================
echo    SANAKA HOSPITALS - PATIENT CASE-TAKING SYSTEM (SIH26047)
echo =========================================================================
echo Starting Backend API server on http://127.0.0.1:8000 ...
start "Sanaka EMR Backend" cmd /k "python run_backend.py"

echo Starting Frontend Web Console on http://localhost:5173 ...
cd frontend
start "Sanaka EMR Frontend" cmd /k "npm run dev"

echo.
echo Both servers are launching!
echo Open http://localhost:5173 in your browser.
echo =========================================================================
