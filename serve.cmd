@echo off
setlocal
cd /d "%~dp0"
set PORT=8080

where py >nul 2>nul
if %errorlevel%==0 goto :usepy

where python >nul 2>nul
if %errorlevel%==0 goto :usepython

echo.
echo Python 3 was not found on this PC.
echo You can still open index.html directly in a browser, or install Python
echo from https://www.python.org/downloads/ and run this file again.
echo.
pause
goto :eof

:usepy
echo Serving NMS 460 Trainer at http://localhost:%PORT%/
start "" "http://localhost:%PORT%/"
py -3 -m http.server %PORT%
goto :eof

:usepython
echo Serving NMS 460 Trainer at http://localhost:%PORT%/
start "" "http://localhost:%PORT%/"
python -m http.server %PORT%
goto :eof
