@echo off
:: Self-healing port cleanup: Free up port 8001 if it is already occupied by a previous server instance
powershell -Command "Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo ===================================================
echo Starting FocusLocus Course Hub Server...
echo ===================================================
echo.
echo Correct Python Runtime: Windows Store Python
echo Server URL: http://localhost:8001
echo.

:: Start parallel background task to wait 2 seconds (for uvicorn startup) and open browser
start /b cmd /c "timeout /t 2 >nul && start http://localhost:8001/"

C:\Users\seela\AppData\Local\Microsoft\WindowsApps\python.exe -m uvicorn backend.main:app --port 8001
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start server. Please ensure port 8001 is free.
    pause
)
