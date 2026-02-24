@echo off
title VOGUE FIND - Start All
color 0E

echo ============================================
echo   VOGUE FIND - Khoi dong toan bo he thong
echo ============================================
echo.
echo   Backend  : http://localhost:8080
echo   Frontend : http://localhost:5173
echo   API Docs : http://localhost:8080/docs
echo.
echo ============================================
echo.

:: Khoi dong Backend trong cua so moi
echo [1/2] Khoi dong Backend...
start "VOGUE FIND - Backend" cmd /k "cd /d "%~dp0" && start_backend.bat"

:: Doi 3 giay de backend khoi dong truoc
timeout /t 3 /nobreak >nul

:: Khoi dong Frontend trong cua so moi
echo [2/2] Khoi dong Frontend...
start "VOGUE FIND - Frontend" cmd /k "cd /d "%~dp0" && start_frontend.bat"

:: Doi them 5 giay roi mo trinh duyet
timeout /t 5 /nobreak >nul

echo.
echo [OK] He thong dang khoi dong!
echo [OK] Mo trinh duyet...
start http://localhost:5173

echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
