@echo off
REM MongoDB Mastering Course - Windows Batch Launcher
REM Automatically detects and runs the appropriate setup script

echo ==============================================
echo MongoDB Mastering Course - Windows Setup
echo ==============================================
echo.

REM Check if PowerShell is available
where pwsh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using PowerShell Core...
    pwsh -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
    goto :end
)

where powershell >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Windows PowerShell...
    powershell -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
    goto :end
)

REM Check if WSL is available
where wsl >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Windows Subsystem for Linux...
    wsl bash "%~dp0setup.sh"
    goto :end
)

echo ERROR: No compatible shell found!
echo.
echo Please install one of the following:
echo   1. PowerShell (recommended) - https://github.com/PowerShell/PowerShell
echo   2. Windows Subsystem for Linux - https://docs.microsoft.com/en-us/windows/wsl/
echo.
pause

:end