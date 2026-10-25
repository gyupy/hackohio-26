@echo off
REM ======================================================================
REM run-server.cmd
REM Convenience launcher for the Buckeye Guild matching server.
REM Wraps run-server.ps1 so you can start it from cmd.exe or by double-click
REM without changing the PowerShell execution policy.
REM
REM Usage:
REM   set LLM_API_KEY=your-gemini-api-key
REM   set LLM_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
REM   run-server.cmd           (starts on http://localhost:8080)
REM   run-server.cmd 9090      (custom port)
REM ======================================================================

setlocal
set PORT=%1
if "%PORT%"=="" set PORT=8080

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-server.ps1" -Port %PORT%

endlocal
