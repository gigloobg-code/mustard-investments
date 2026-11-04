# 🟡 Mustard Investments (Open-Source Replica)

> **A self-hosted, full-featured replica of the Mustard Investments paper trading & virtual portfolio simulator.** Built for students, schools, and independent traders to practice risk-free investing across the London Stock Exchange (LSE), US Equities, and Crypto.

---

## 🚀 Why This Project Exists

Mustard Investments (`mustardinvestments.com`) went down due to an expired/disabled cloud deployment (`HTTP 402 Payment Required`). This standalone replica reproduces the complete trading simulator, portfolio manager, market explorer, order execution system, and Mustard Cup leaderboard without requiring paid external hosting or server dependencies.

---

## ✨ Key Features

- **💼 Portfolio & Paper Trading:**
  - Start with £25,000 (or customizable £1,000, £10,000, £100,000) in virtual cash.
  - Track real-time Net Worth, Invested Capital, Cash Balance, and Daily/Total P&L (£ and %).
  - Real-time asset allocation breakdown (Stocks, Crypto, ETFs, Cash).

- **📈 Real-Time Markets & Screener:**
  - **UK / FTSE 100:** Rolls-Royce (`RR.L`), Shell (`SHEL.L`), BP (`BP.L`), Barclays (`BARC.L`), AstraZeneca (`AZN.L`), Lloyds (`LLOY.L`), Tesco (`TSCO.L`), Vodafone (`VOD.L`), NatWest (`NWG.L`), HSBC (`HSBA.L`), Ocado (`OCDO.L`).
  - **US Tech Leaders:** Apple (`AAPL`), Microsoft (`MSFT`), Nvidia (`NVDA`), Tesla (`TSLA`), Google (`GOOGL`), Amazon (`AMZN`).
  - **Crypto:** Bitcoin (`BTC`), Ethereum (`ETH`), Solana (`SOL`).
  - **ETFs & Indices:** S&P 500 (`VUSA`), FTSE 100 (`ISF`).
  - Live price fluctuation simulation engine with realistic Brownian motion and price trends.
  - Interactive price charts with timeframe toggles (1D, 1W, 1M, 1Y, ALL).

- **⚡ Order Execution Terminal:**
  - Market & Limit order simulation.
  - Buy & Sell in Shares or direct £ / $ currency amounts (with fractional shares).
  - Instant order fulfillment with zero commission fees.

- **🌱 Faith & Values Alignment Screener:**
  - True to Mustard's hallmark feature: filter investments by **Halal / Shariah Compliant**, **ESG Green**, and **Ethical / Faith-Aligned** badges.

- **🏆 Mustard Cup Leaderboard:**
  - Inter-school and community championship simulator ranking top student and team portfolios.

- **🎯 Gamification & Achievements:**
  - XP progression, daily trading streaks, and unlockable badges ("Mustard Seed", "FTSE Titan", "Diamond Hands", "Diversifier").

- **💾 LocalStorage & Portability:**
  - Zero external database required — all portfolio holdings and transactions persist locally in your browser.
  - Built-in **Export / Import JSON** backup so you never lose your progress.
  - One-click currency switch between **GBP (£)** and **USD ($)**.

---

## 🏃 Running the Application

### 1. One-Click Launch (Recommended)
Double-click [**`Launch Mustard.bat`**](Launch%20Mustard.bat) or open [**`index.html`**](index.html) directly in any modern browser (Chrome, Edge, Firefox, Safari).

### 2. Local Python Server (Optional)
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080`.

---

## 🌐 Deploying to GitHub Pages (Free)

1. Create a new repository on GitHub: `mustard-investments`
2. Push this folder to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Mustard Investments Simulator replica"
   git branch -M main
   git remote add origin https://github.com/<your-username>/mustard-investments.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** > **Pages**
   - Under **Build and deployment** > **Branch**, select `main` / `root` and click **Save**.
   - Your live replica will be hosted at `https://<your-username>.github.io/mustard-investments/`!
