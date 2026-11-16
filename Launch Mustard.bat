@echo off
title Mustard Investments UK - Live Stock Trading Simulator
echo ========================================================
echo Starting Mustard Investments UK Trading Platform...
echo ========================================================
echo.

python -m pip install -r requirements.txt --quiet
start http://127.0.0.1:5000
python app.py

pause
