@echo off
REM Update the MongoDB Mastering course repo from any checkout location.
REM %~dp0 = directory containing this .bat (the scripts/ folder).
REM %~dp0.. = the project root (one level up from scripts/).
powershell -Command "Set-Location '%~dp0..'; Write-Host 'Pulling latest changes from repository...' -ForegroundColor Green; git pull; Write-Host 'Pull complete!' -ForegroundColor Green"
pause
