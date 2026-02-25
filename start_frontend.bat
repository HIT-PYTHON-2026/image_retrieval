@echo off
title VOGUE FIND - Frontend (Debug Mode)
color 0B

echo ============================================
echo   VOGUE FIND - Frontend (React + Vite)
echo   http://localhost:5173
echo ============================================
echo.

:: Di chuyen vao thu muc frontend
cd /d "%~dp0frontend-react"

:: Kiem tra Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js khong tim thay! Hay cai Node.js 18+
    pause
    exit /b 1
)

:: Cai dependencies neu chua co
if not exist "node_modules" (
    echo [INFO] Chua co node_modules, dang chay npm install...
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install that bai!
        pause
        exit /b 1
    )
)

echo [INFO] Khoi dong Frontend hien thi log loi nguyen ban cua Vite...
echo [INFO] Nhan Ctrl+C de dung
echo.

:: Chay voi Vite hien log loi tren console de de trace bug
npm run dev

echo.
echo [ERROR] Frontend dot ngot dung hoat dong!
pause
