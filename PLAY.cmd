@echo off
rem AI-use disclosure: Codex-authored local game launcher. Run manually to play.
cd /d "%~dp0"
if not exist "node_modules\vite\bin\vite.js" call npm install
if errorlevel 1 exit /b 1
call npm run dev -- --host 127.0.0.1
