# 📈 UK Stock Trading & Virtual Portfolio Simulator

A real-time UK stock trading platform and investment simulator. Every user starts with **£10,000.00** in virtual capital to trade live London Stock Exchange (FTSE 100) equities, create private multi-user accounts, track real-time profit and loss, and manage their investments risk-free.

---

## 🌐 Live Website

- **GitHub Pages Link**: [https://gigloobg-code.github.io/mustard-investments/](https://gigloobg-code.github.io/mustard-investments/)

---

## ✨ Key Features

- **💷 £10,000.00 Initial Capital**: Every newly created account begins with ten thousand pounds in virtual cash.
- **🔒 Multi-User Private Accounts**: Supports multiple independent accounts. Each investor's cash balance, holdings, and transaction history are completely private.
- **🇬🇧 Live Real-Time UK Equities**: Tracks major UK stocks listed on the London Stock Exchange (FTSE 100), including AstraZeneca (`AZN.L`), Shell (`SHEL.L`), HSBC (`HSBA.L`), Unilever (`ULVR.L`), BP (`BP.L`), Rolls-Royce (`RR.L`), BAE Systems (`BA.L`), Barclays (`BARC.L`), Tesco (`TSCO.L`), and more.
- **📈 Real-Time Profit & Loss (P&L)**:
  - Dynamically updates portfolio valuation as share prices change.
  - Computes unrealized gains and losses on current holdings.
  - Computes realized gains and losses when shares are sold ("taking money out").
- **⚡ Trading Execution Engine**:
  - Instant Buy and Sell orders with percentage calculation shortcuts (`25%`, `50%`, `75%`, `MAX`).
  - Zero-commission simulation.
- **📊 Interactive Charts & Sparklines**: Intraday trend charts, 24-hour price ranges, and volume data for every stock.
- **🏆 Community Leaderboard**: Compare total portfolio return with other registered investors.
- **🚀 Dual Deployment Architecture**:
  - **Full-Stack Mode**: Flask backend with SQLite database for persistent multi-device accounts.
  - **Static GitHub Pages Mode**: In-browser local account engine with zero setup required.

---

## 💻 Local Setup & Running

### Requirements
- Python 3.10+
- `pip`

### Quick Start
```bash
# Clone the repository
git clone https://github.com/gigloobg-code/mustard-investments.git
cd mustard-investments

# Install dependencies
pip install -r requirements.txt

# Start the application
python app.py
```

Then visit `http://127.0.0.1:5000` in your web browser.

---

## ☁️ Cloud Deployment Options

### 1. GitHub Pages (Static Mode)
This repository includes an automated GitHub Actions deployment workflow in `.github/workflows/deploy.yml`. When you push to the `main` branch, the site deploys automatically to GitHub Pages.

### 2. Render / Railway / Docker (Full-Stack Multi-User Backend)
- **Render**: Connect the repository and select Web Service. The included `render.yaml` automatically sets up Python and Gunicorn.
- **Docker**: Build and run using the included `Dockerfile`:
  ```bash
  docker build -t uk-stock-simulator .
  docker run -p 5000:5000 uk-stock-simulator
  ```

---

## 📄 License
MIT License. Created for educational and paper trading simulation purposes.
