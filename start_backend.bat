@echo off
title VOGUE FIND - Backend API (Debug Mode)
color 0A

echo ============================================
echo   VOGUE FIND - Backend (FastAPI)
echo   http://localhost:8080
echo   Docs: http://localhost:8080/docs
echo ============================================
echo.

:: Di chuyen ve thu muc goc du an
cd /d "%~dp0"

:: Kich hoat moi truong ao neu co
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Kich hoat moi truong ao venv...
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] Khong tim thay thu muc venv. Co the module se bi thieu!
)

:: Kiem tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python khong tim thay! Hay cai Python 3.9+
    pause
    exit /b 1
)

:: Kiem tra uvicorn
pip show uvicorn >nul 2>&1
if errorlevel 1 (
    echo [INFO] Dang cai uvicorn...
    pip install uvicorn fastapi
)

echo [INFO] Khoi dong Backend voi log chi tiet (Reload enabled)...
echo [INFO] Bat che do debug log...
echo [INFO] Nhan Ctrl+C de dung
echo.

:: Chay voi log-level debug de hien chi tiet tat ca requet/error
uvicorn src.app.app:app --reload --port 8080 --host 0.0.0.0 --log-level debug

echo.
echo [ERROR] Backend dot ngot dung hoat dong!
pause
