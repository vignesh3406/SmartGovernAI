@echo off
echo ===================================================
echo Starting SmartGov AI Servers...
echo ===================================================

echo Starting Backend Server...
start "SmartGov Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\activate && python manage.py runserver"

echo Starting Frontend Server...
start "SmartGov Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting in new windows!
echo You can close this window now.
pause
