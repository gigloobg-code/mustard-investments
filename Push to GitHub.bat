@echo off
title Mustard Investments - GitHub Uploader
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0upload_to_github.ps1"
pause
