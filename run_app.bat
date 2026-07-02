@echo off
echo ===================================================
echo Starting FocusLocus Course Hub Server...
echo ===================================================
echo.
echo Correct Python Runtime: Windows Store Python
echo Server URL: http://localhost:8000
echo.
C:\Users\seela\AppData\Local\Microsoft\WindowsApps\python.exe -m uvicorn backend.main:app --port 8000
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start server. Please ensure port 8000 is free.
    pause
)
