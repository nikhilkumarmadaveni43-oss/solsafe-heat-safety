@echo off
title SolSafe - Heat Safety & Microclimate Cool-Routing Server
echo =====================================================================
echo  SolSafe: Real-World Heat Safety & Cool-Route Orchestration System
echo =====================================================================
echo.
echo [1/2] Launching SolSafe FastAPI server on port 8050...
start "" http://127.0.0.1:8050
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8050 --reload
pause
