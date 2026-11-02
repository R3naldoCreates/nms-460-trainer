@echo off
REM ============================================================
REM  publish.cmd - one command to push this project to GitHub Pages
REM
REM    publish.cmd                        update, push, wait for Pages
REM    publish.cmd -m "Fix the step strip"
REM    publish.cmd --dry-run              show what would go up
REM    publish.cmd --no-verify            push without waiting
REM
REM  The work is done by tools\nmsdeploy (Rust). If the exe is missing
REM  it is compiled on the spot, provided cargo is on PATH.
REM ============================================================
setlocal
pushd "%~dp0"

set "EXE=tools\nmsdeploy\target\release\nmsdeploy.exe"

if exist "%EXE%" goto run

where cargo >nul 2>nul
if errorlevel 1 (
  echo.
  echo nmsdeploy is not built and cargo is not on PATH.
  echo Install Rust from https://rustup.rs then run this again.
  echo.
  popd
  exit /b 1
)

echo Building nmsdeploy (first run only) ...
cargo run --release --quiet --manifest-path "tools\nmsdeploy\Cargo.toml" -- %*
set RC=%ERRORLEVEL%
popd
exit /b %RC%

:run
"%EXE%" %*
set RC=%ERRORLEVEL%
popd
exit /b %RC%
