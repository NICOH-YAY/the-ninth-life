@echo off
rem AI-use disclosure: Codex-authored launcher for the native Godot web build.
cd /d "%~dp0"
call npm run dev
if errorlevel 1 pause
