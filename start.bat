@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"

title PC Workbench Launcher

echo.
echo ============================================================
echo   PC Workbench - Local Preview Launcher
echo ============================================================
echo.

rem ------------------------------------------------------------
rem 1. Find Python 3 (py launcher first, then python.exe)
rem ------------------------------------------------------------
set "PY_CMD="

where py >nul 2>nul
if not errorlevel 1 (
  py -3 -c "import sys" >nul 2>nul
  if not errorlevel 1 set "PY_CMD=py -3"
)

if not defined PY_CMD (
  where python >nul 2>nul
  if not errorlevel 1 (
    python -c "import sys; assert sys.version_info[0] == 3" >nul 2>nul
    if not errorlevel 1 set "PY_CMD=python"
  )
)

if not defined PY_CMD (
  echo [ERROR] Python 3 was not found.
  echo.
  echo Install Python 3 from:
  echo   https://www.python.org/downloads/
  echo.
  echo During installation, enable:
  echo   "Add Python to PATH"
  echo.
  pause
  exit /b 1
)

echo [OK] Python command: %PY_CMD%

rem ------------------------------------------------------------
rem 2. Choose port: 8080 first, 8123 if 8080 is occupied
rem ------------------------------------------------------------
set "PORT=8080"

call :PortInUse 8080
if not errorlevel 1 (
  echo [INFO] Port 8080 is already in use.
  set "PORT=8123"

  call :PortInUse 8123
  if not errorlevel 1 (
    echo [ERROR] Both port 8080 and port 8123 are already in use.
    echo Close the program using one of these ports and try again.
    echo.
    pause
    exit /b 1
  )
)

echo [OK] Using port %PORT%

rem ------------------------------------------------------------
rem 3. Start the static server in a separate minimized window
rem ------------------------------------------------------------
start "PC Workbench Server" /min cmd /k "%PY_CMD% -m http.server %PORT% --bind 127.0.0.1"
timeout /t 2 /nobreak >nul

call :PortInUse %PORT%
if errorlevel 1 (
  echo [ERROR] The local server failed to start.
  echo Check that Python can run, or try running start.bat as administrator.
  echo.
  pause
  exit /b 1
)

rem ------------------------------------------------------------
rem 4. Open browser and keep this launcher visible
rem ------------------------------------------------------------
echo.
echo ============================================================
echo   Local server is running:
echo   http://127.0.0.1:%PORT%/
echo.
echo   Browser opened automatically.
echo   The server runs in a minimized window.
echo   Close that server window to stop the server.
echo ============================================================
echo.

start "" "http://127.0.0.1:%PORT%/"

echo Press any key to close this launcher.
echo The server will keep running until its minimized window is closed.
pause >nul
exit /b 0

rem ------------------------------------------------------------
rem Helper: errorlevel 0 = port is in use, 1 = port is free
rem ------------------------------------------------------------
:PortInUse
%PY_CMD% -c "import socket,sys; s=socket.socket(); s.settimeout(0.25); sys.exit(0 if s.connect_ex(('127.0.0.1', %~1)) == 0 else 1)"
if errorlevel 1 exit /b 1
exit /b 0
