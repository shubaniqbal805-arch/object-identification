@echo off
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
  echo Starting local server with Python...
  py -m http.server 8000
  exit /b %errorlevel%
)

where python >nul 2>nul
if not errorlevel 1 (
  echo Starting local server with Python...
  python -m http.server 8000
  exit /b %errorlevel%
)

where npx >nul 2>nul
if not errorlevel 1 (
  echo Python not found. Starting local server with Node...
  npx --yes serve . -l 8000
  exit /b %errorlevel%
)

echo Neither Python nor Node.js was found on this system.
 echo Install Python or Node.js, then run this script again.
exit /b 1
