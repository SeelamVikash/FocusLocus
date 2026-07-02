@echo off
setlocal enabledelayedexpansion
title FocusLocus Installer & Setup

echo =========================================================
echo               FocusLocus Course Hub Setup
echo =========================================================
echo.

:: 1. Check if Python is installed
echo [1/4] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python was not detected on your system.
    echo FocusLocus will now install Python 3.12 silently via Windows Package Manager (winget)...
    echo.
    
    winget install --id Python.Python.3.12 --silent --accept-source-agreements --accept-package-agreements
    
    if !errorlevel! neq 0 (
        echo.
        echo [ERROR] winget failed to install Python automatically.
        echo Please download and install Python manually from: https://www.python.org/downloads/
        echo IMPORTANT: Make sure to check the 'Add Python to PATH' box during setup.
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo =========================================================
    echo Python has been successfully installed!
    echo.
    echo IMPORTANT: Windows needs to refresh environment variables.
    echo Please CLOSE this window and double-click 'setup.bat' again
    echo to complete the installation.
    echo =========================================================
    echo.
    pause
    exit /b 0
) else (
    for /f "tokens=2" %%v in ('python --version') do set pyver=%%v
    echo Python is already installed (Version !pyver!^).
)

:: 2. Install/Upgrade Dependencies
echo.
echo [2/4] Installing FocusLocus Python libraries...
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Default pip command failed. Attempting alternative setup...
    python -m pip install -r requirements.txt
    if !errorlevel! neq 0 (
        echo.
        echo [ERROR] Package installation failed. Please check your internet connection.
        pause
        exit /b 1
    )
)
echo Dependencies installed successfully!

:: 3. Ask and Create a Desktop Shortcut
echo.
echo [3/4] Desktop Shortcut setup...
set /p make_shortcut="Would you like to create a FocusLocus shortcut on your Desktop? (Y/N): "
if /I "!make_shortcut!"=="Y" (
    set "LAUNCHER_PATH=%~dp0FocusLocus.exe"
    set "SHORTCUT_PATH=%USERPROFILE%\Desktop\FocusLocus.lnk"

    :: Use PowerShell to write a secure shortcut file (.lnk) referencing the compiled EXE
    powershell -Command "^
        $WshShell = New-Object -ComObject WScript.Shell; ^
        $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); ^
        $Shortcut.TargetPath = '%LAUNCHER_PATH%'; ^
        $Shortcut.WorkingDirectory = '%~dp0'; ^
        $Shortcut.Description = 'Launch FocusLocus Smart Course Hub'; ^
        $Shortcut.IconLocation = '%LAUNCHER_PATH%,0'; ^
        $Shortcut.Save()"

    if !errorlevel! eq 0 (
        echo Desktop shortcut created! (Look for the Rocket icon on your Desktop)
    ) else (
        echo [WARNING] Could not create Desktop shortcut automatically. You can launch the app by double-clicking FocusLocus.exe.
    )
) else (
    echo Skipping Desktop shortcut creation. You can launch FocusLocus anytime by double-clicking FocusLocus.exe.
)

:: 4. Launching the App
echo.
echo [4/4] Starting backend server and loading FocusLocus...
start /b cmd /c "python -m uvicorn backend.main:app --port 8001"
timeout /t 3 >nul
start http://localhost:8001/

echo.
echo =========================================================
echo              INSTALLATION COMPLETED SUCCESSFULLY!
echo =========================================================
echo.
echo FocusLocus has been set up and is now starting.
echo.
echo HOW TO LAUNCH THE APP IN THE FUTURE:
echo ---------------------------------------------------------
echo 1. [RECOMMENDED] DOUBLE-CLICK the "FocusLocus" icon on
echo    your Desktop (look for the Rocket icon!).
echo.
echo 2. OR double-click the "FocusLocus.exe" launcher inside this folder:
echo    %~dp0FocusLocus.exe
echo.
echo 3. Once launched, you can access the interface in your
echo    browser at: http://localhost:8001/
echo.
echo =========================================================
echo.
pause
