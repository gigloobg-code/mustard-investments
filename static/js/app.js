/**
 * Mustard Investments UK - Interactive Frontend Engine
 * Supports UK FTSE 100 Stocks, Cryptocurrencies, Flask Backend API, and GitHub Pages Client Mode.
 */

// Global State
const state = {
  user: null,
  portfolio: {
    cash_balance: 10000.0,
    holdings_value: 0.0,
    total_portfolio_value: 10000.0,
    overall_pnl: 0.0,
    overall_pnl_pct: 0.0,
    holdings: []
  },
  stocks: [],
  stocksMap: {},
  transactions: [],
  leaderboard: [],
  activeTab: 'stocks',
  activeSector: 'ALL',
  searchQuery: '',
  activeStock: null,
  tradeMode: 'BUY',
  tradeInputMode: 'UNITS', // 'UNITS' or 'CASH'
  isClientMode: false,
  prevPrices: {}
};

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  initClock();
  setupEventListeners();

  // Test if Flask backend is available
  try {
    const res = await fetch('/api/auth/me', { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      state.isClientMode = false;
      if (data.authenticated) {
        state.user = data.user;
      }
    } else {
      setupClientMode();
    }
  } catch (err) {
    console.log('Backend not detected, falling back to Client-Side Mode (GitHub Pages compatible).');
    setupClientMode();
  }

  // Initial load
  await loadStocks();
  if (state.user) {
    await loadPortfolio();
    await loadTransactions();
  }
  updateAuthUI();
  renderApp();

  // Polling loop for live real-time prices every 5 seconds
  setInterval(async () => {
    await loadStocks(false);
    if (state.user) {
      await loadPortfolio(false);
    }
  }, 5000);
});

// -----------------------------------------------------------------------------
// Live Clock & Market Hours
// -----------------------------------------------------------------------------
function initClock() {
  const clockEl = document.getElementById('marketClock');
  const update = () => {
    const now = new Date();
    // London time
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour12: false });
    if (clockEl) clockEl.textContent = `${timeStr} GMT`;
  };
  update();
  setInterval(update, 1000);
}

// -----------------------------------------------------------------------------
// API & Client-Side Multi-Account Storage Engine
// -----------------------------------------------------------------------------
function setupClientMode() {
  state.isClientMode = true;
  if (!localStorage.getItem('mustard_users')) {
    const defaultUser = {
      id: 1,
      username: 'DemoTrader',
      email: 'demo@mustard.co.uk',
      password: 'password123',
      cash_balance: 10000.0,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('mustard_users', JSON.stringify([defaultUser]));
    localStorage.setItem('mustard_current_user', JSON.stringify(defaultUser));
    localStorage.setItem('mustard_portfolios', JSON.stringify({ 1: [] }));
    localStorage.setItem('mustard_transactions', JSON.stringify({ 1: [] }));
  }

  const savedUser = localStorage.getItem('mustard_current_user');
  if (savedUser) {
    try {
      state.user = JSON.parse(savedUser);
    } catch (e) {}
  }
}

// -----------------------------------------------------------------------------
// Data Fetching
// -----------------------------------------------------------------------------
async function loadStocks(fullRender = true) {
  try {
    let stocks = [];
    if (!state.isClientMode) {
      const res = await fetch('/api/stocks');
      if (res.ok) {
        const data = await res.json();
        stocks = data.stocks;
      }
    }

    if (!stocks || stocks.length === 0) {
      stocks = getSimulatedMarketAssets();
    }

    // Detect price movements for flash animations
    stocks.forEach(s => {
      const old = state.stocksMap[s.symbol];
      if (old && old.price !== s.price) {
        s.flash = s.price > old.price ? 'up' : 'down';
      }
      state.stocksMap[s.symbol] = s;
    });

    state.stocks = stocks;
    renderTickerTape();

    if (fullRender) {
      renderStocksTable();
    } else {
      updateStockPricesInPlace();
    }
  } catch (err) {
    console.error('Error loading stocks:', err);
  }
}

async function loadPortfolio(fullRender = true) {
  if (!state.user) return;

  try {
    if (!state.isClientMode) {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        state.portfolio = await res.json();
      }
    } else {
      // Client mode portfolio calculation
      const portfolios = JSON.parse(localStorage.getItem('mustard_portfolios') || '{}');
      const userHoldings = portfolios[state.user.id] || [];
      const users = JSON.parse(localStorage.getItem('mustard_users') || '[]');
      const currentUser = users.find(u => u.id === state.user.id) || state.user;
      const cash = currentUser.cash_balance;

      let holdingsVal = 0.0;
      const enrichedHoldings = userHoldings.map(h => {
        const asset = state.stocksMap[h.symbol] || { price: h.average_buy_price, name: h.symbol, asset_type: 'STOCK' };
        const curVal = round(h.shares * asset.price);
        const pnl = round(curVal - h.total_invested);
        const pnl_pct = h.total_invested > 0 ? round((pnl / h.total_invested) * 100) : 0;
        holdingsVal += curVal;
        return {
          symbol: h.symbol,
          name: asset.name,
          asset_type: asset.asset_type || (h.symbol.includes('-GBP') ? 'CRYPTO' : 'STOCK'),
          shares: h.shares,
          average_buy_price: h.average_buy_price,
          current_price: asset.price,
          total_invested: h.total_invested,
          current_value: curVal,
          pnl: pnl,
          pnl_pct: pnl_pct
        };
      });

      const totalVal = round(cash + holdingsVal);
      const overallPnl = round(totalVal - 10000.0);
      const overallPnlPct = round((overallPnl / 10000.0) * 100);

      state.portfolio = {
        cash_balance: cash,
        holdings_value: round(holdingsVal),
        total_portfolio_value: totalVal,
        overall_pnl: overallPnl,
        overall_pnl_pct: overallPnlPct,
        holdings: enrichedHoldings
      };
    }

    renderPortfolioStats();
    if (state.activeTab === 'portfolio' && fullRender) {
      renderHoldingsTable();
    }
  } catch (err) {
    console.error('Error loading portfolio:', err);
  }
}

async function loadTransactions() {
  if (!state.user) return;
  try {
    if (!state.isClientMode) {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        state.transactions = data.transactions;
      }
    } else {
      const allTx = JSON.parse(localStorage.getItem('mustard_transactions') || '{}');
      state.transactions = allTx[state.user.id] || [];
    }
    if (state.activeTab === 'history') {
      renderHistoryTable();
    }
  } catch (err) {
    console.error('Error loading transactions:', err);
  }
}

async function loadLeaderboard() {
  try {
    if (!state.isClientMode) {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        state.leaderboard = data.leaderboard;
      }
    } else {
      const users = JSON.parse(localStorage.getItem('mustard_users') || '[]');
      const portfolios = JSON.parse(localStorage.getItem('mustard_portfolios') || '{}');

      state.leaderboard = users.map(u => {
        const userHoldings = portfolios[u.id] || [];
        const stockVal = userHoldings.reduce((acc, h) => {
          const s = state.stocksMap[h.symbol];
          return acc + (h.shares * (s ? s.price : h.average_buy_price));
        }, 0);
        const total = round(u.cash_balance + stockVal);
        const pnl = round(total - 10000.0);
        return {
          username: u.username,
          total_value: total,
          pnl: pnl,
          pnl_pct: round((pnl / 10000.0) * 100),
          is_current_user: state.user && state.user.id === u.id
        };
      }).sort((a, b) => b.total_value - a.total_value);
    }
    renderLeaderboard();
  } catch (err) {
    console.error('Error loading leaderboard:', err);
  }
}

// -----------------------------------------------------------------------------
// Rendering UI
// -----------------------------------------------------------------------------
function renderApp() {
  renderPortfolioStats();
  renderStocksTable();
  if (state.activeTab === 'portfolio') renderHoldingsTable();
  if (state.activeTab === 'history') renderHistoryTable();
  if (state.activeTab === 'leaderboard') renderLeaderboard();
}

function renderTickerTape() {
  const track = document.getElementById('tickerTrack');
  if (!track || state.stocks.length === 0) return;

  const html = state.stocks.map(s => {
    const isUp = s.change_pct >= 0;
    const sign = isUp ? '+' : '';
    const icon = s.asset_type === 'CRYPTO' ? '🪙' : '🇬🇧';
    return `
      <div class="ticker-item" onclick="openTradeModal('${s.symbol}', 'BUY')">
        <span class="ticker-sym">${icon} ${s.symbol}</span>
        <span class="ticker-price">£${formatPrice(s.price)}</span>
        <span class="${isUp ? 'up' : 'down'}">${sign}${s.change_pct.toFixed(2)}%</span>
      </div>
    `;
  }).join('');

  track.innerHTML = html + html;
}

function renderPortfolioStats() {
  const totalValEl = document.getElementById('statTotalValue');
  const cashValEl = document.getElementById('statCashBalance');
  const investedValEl = document.getElementById('statInvested');
  const pnlValEl = document.getElementById('statPnl');
  const navCashEl = document.getElementById('navCash');

  const cash = state.portfolio.cash_balance;
  const holdingsVal = state.portfolio.holdings_value;
  const totalVal = state.portfolio.total_portfolio_value;
  const pnl = state.portfolio.overall_pnl;
  const pnlPct = state.portfolio.overall_pnl_pct;
  const isUp = pnl >= 0;

  if (totalValEl) totalValEl.textContent = `£${formatMoney(totalVal)}`;
  if (cashValEl) cashValEl.textContent = `£${formatMoney(cash)}`;
  if (investedValEl) investedValEl.textContent = `£${formatMoney(holdingsVal)}`;
  if (navCashEl) navCashEl.textContent = `£${formatMoney(cash)}`;

  if (pnlValEl) {
    pnlValEl.className = `stat-sub ${isUp ? 'up' : 'down'}`;
    pnlValEl.innerHTML = `
      <span>${isUp ? '▲' : '▼'} £${formatMoney(Math.abs(pnl))} (${isUp ? '+' : ''}${pnlPct.toFixed(2)}%)</span>
      <span style="color: var(--text-muted); font-weight: normal; margin-left: 4px;">from £10k start</span>
    `;
  }
}

function renderStocksTable() {
  const tbody = document.getElementById('stocksTableBody');
  if (!tbody) return;

  const countBadge = document.getElementById('tabCountStocks');
  if (countBadge) countBadge.textContent = state.stocks.length;

  const filtered = state.stocks.filter(s => {
    let matchesCategory = true;
    if (state.activeSector === 'ALL') {
      matchesCategory = true;
    } else if (state.activeSector === 'CRYPTO') {
      matchesCategory = s.asset_type === 'CRYPTO';
    } else if (state.activeSector === 'STOCKS') {
      matchesCategory = s.asset_type === 'STOCK';
    } else {
      matchesCategory = s.sector.toUpperCase() === state.activeSector.toUpperCase();
    }

    const query = state.searchQuery.toLowerCase();
    const matchesSearch = s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No assets found</h3>
          <p>Try searching for a different ticker, company, or coin.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const isUp = s.change_pct >= 0;
    const sign = isUp ? '+' : '';
    const flashClass = s.flash === 'up' ? 'price-flash-up' : (s.flash === 'down' ? 'price-flash-down' : '');
    const assetBadge = s.asset_type === 'CRYPTO'
      ? `<span class="brand-badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; margin-left: 6px;">🪙 CRYPTO</span>`
      : `<span class="sector-tag" style="margin-left: 6px;">🇬🇧 LSE</span>`;

    return `
      <tr class="${flashClass}" id="stock-row-${s.symbol}">
        <td>
          <div class="stock-cell">
            <div>
              <div class="stock-symbol-tag">
                ${s.symbol}
                ${assetBadge}
              </div>
              <div class="stock-subname" title="${s.name}">${s.name}</div>
            </div>
          </div>
        </td>
        <td><span class="sector-tag">${s.sector}</span></td>
        <td class="price-cell">£${formatPrice(s.price)}</td>
        <td>
          <span class="change-badge ${isUp ? 'up' : 'down'}">
            ${isUp ? '▲' : '▼'} ${sign}${s.change_pct.toFixed(2)}%
          </span>
        </td>
        <td style="color: var(--text-secondary); font-size: 0.8rem;">
          £${formatPrice(s.day_low)} - £${formatPrice(s.day_high)}
        </td>
        <td>${renderSparklineSvg(s.sparkline, isUp)}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="openStockDetail('${s.symbol}')">Details</button>
            <button class="btn btn-primary btn-sm" onclick="openTradeModal('${s.symbol}', 'BUY')">Trade</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateStockPricesInPlace() {
  state.stocks.forEach(s => {
    const row = document.getElementById(`stock-row-${s.symbol}`);
    if (row) {
      const priceCell = row.querySelector('.price-cell');
      if (priceCell) priceCell.textContent = `£${formatPrice(s.price)}`;

      const badge = row.querySelector('.change-badge');
      if (badge) {
        const isUp = s.change_pct >= 0;
        badge.className = `change-badge ${isUp ? 'up' : 'down'}`;
        badge.innerHTML = `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${s.change_pct.toFixed(2)}%`;
      }

      if (s.flash) {
        row.classList.remove('price-flash-up', 'price-flash-down');
        void row.offsetWidth;
        row.classList.add(s.flash === 'up' ? 'price-flash-up' : 'price-flash-down');
        s.flash = null;
      }
    }
  });
}

function renderHoldingsTable() {
  const container = document.getElementById('holdingsContainer');
  if (!container) return;

  const holdings = state.portfolio.holdings || [];

  if (holdings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📈</div>
        <h3>No investments yet</h3>
        <p>You have £${formatMoney(state.portfolio.cash_balance)} in cash ready to invest in UK stocks and cryptocurrencies.</p>
        <button class="btn btn-primary" onclick="switchTab('stocks')">Explore Market</button>
      </div>
    `;
    return;
  }

  const rows = holdings.map(h => {
    const isUp = h.pnl >= 0;
    const sign = isUp ? '+' : '';
    const isCrypto = h.asset_type === 'CRYPTO' || h.symbol.includes('-GBP');
    const badge = isCrypto ? '🪙 ' : '🇬🇧 ';

    return `
      <tr>
        <td>
          <div class="stock-symbol-tag">${badge}${h.symbol}</div>
          <div class="stock-subname">${h.name}</div>
        </td>
        <td><strong>${formatShares(h.shares, isCrypto)}</strong></td>
        <td>£${formatPrice(h.average_buy_price)}</td>
        <td>£${formatPrice(h.current_price)}</td>
        <td><strong>£${formatMoney(h.current_value)}</strong></td>
        <td>
          <span class="change-badge ${isUp ? 'up' : 'down'}">
            ${isUp ? '▲' : '▼'} ${sign}£${formatMoney(Math.abs(h.pnl))} (${sign}${h.pnl_pct.toFixed(2)}%)
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.4rem;">
            <button class="btn btn-success btn-sm" onclick="openTradeModal('${h.symbol}', 'BUY')">Buy More</button>
            <button class="btn btn-danger btn-sm" onclick="openTradeModal('${h.symbol}', 'SELL')">Sell</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Quantity / Coins</th>
            <th>Avg Buy Price</th>
            <th>Current Price</th>
            <th>Current Value</th>
            <th>Profit / Loss</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderHistoryTable() {
  const container = document.getElementById('historyContainer');
  if (!container) return;

  const txs = state.transactions || [];
  if (txs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📜</div>
        <h3>No transaction history</h3>
        <p>Buy or sell assets to see your historical order book here.</p>
      </div>
    `;
    return;
  }

  const rows = txs.map(t => {
    const isBuy = t.type === 'BUY';
    const isSell = t.type === 'SELL';
    const isCrypto = t.symbol.includes('-GBP');
    const pnlDisplay = isSell ? `
      <span class="${t.realized_pnl >= 0 ? 'up' : 'down'}">
        ${t.realized_pnl >= 0 ? '+' : ''}£${formatMoney(t.realized_pnl)}
      </span>
    ` : '—';

    return `
      <tr>
        <td><span class="change-badge ${isBuy ? 'up' : (isSell ? 'down' : '')}">${t.type}</span></td>
        <td>
          <div class="stock-symbol-tag">${t.symbol}</div>
          <div class="stock-subname">${t.stock_name}</div>
        </td>
        <td>${t.shares ? formatShares(t.shares, isCrypto) : '—'}</td>
        <td>£${t.price_per_share ? formatPrice(t.price_per_share) : '—'}</td>
        <td><strong>£${formatMoney(t.total_amount)}</strong></td>
        <td>${pnlDisplay}</td>
        <td style="color: var(--text-secondary); font-size: 0.8rem;">
          ${new Date(t.created_at).toLocaleString('en-GB')}
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Asset</th>
            <th>Units / Shares</th>
            <th>Execution Price</th>
            <th>Total Amount</th>
            <th>Realized Gain/Loss</th>
            <th>Date & Time</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboardContainer');
  if (!container) return;

  const rows = state.leaderboard.map((entry, idx) => {
    const rank = idx + 1;
    const medal = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `#${rank}`));
    const isUp = entry.pnl >= 0;
    const sign = isUp ? '+' : '';

    return `
      <tr style="${entry.is_current_user ? 'background: rgba(245, 158, 11, 0.08); font-weight: bold;' : ''}">
        <td style="font-size: 1.1rem; text-align: center; width: 60px;">${medal}</td>
        <td>
          <span style="color: #fff;">${entry.username}</span>
          ${entry.is_current_user ? '<span class="brand-badge" style="margin-left: 6px;">YOU</span>' : ''}
        </td>
        <td><strong>£${formatMoney(entry.total_value)}</strong></td>
        <td>
          <span class="change-badge ${isUp ? 'up' : 'down'}">
            ${isUp ? '▲' : '▼'} ${sign}£${formatMoney(Math.abs(entry.pnl))} (${sign}${entry.pnl_pct.toFixed(2)}%)
          </span>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center;">Rank</th>
            <th>Investor</th>
            <th>Total Portfolio Value</th>
            <th>Overall Performance</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderSparklineSvg(points, isUp) {
  if (!points || points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 90;
  const height = 30;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const strokeColor = isUp ? '#10b981' : '#ef4444';

  return `
    <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}">
      <polyline
        fill="none"
        stroke="${strokeColor}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        points="${coords}"
      />
    </svg>
  `;
}

// -----------------------------------------------------------------------------
// Trading Engine Modal (Supports Fractional Shares & Crypto)
// -----------------------------------------------------------------------------
function openTradeModal(symbol, mode = 'BUY') {
  if (!state.user) {
    openAuthModal('login');
    showToast('Please sign in or create an account to start trading.', 'info');
    return;
  }

  const asset = state.stocksMap[symbol];
  if (!asset) return;

  state.activeStock = asset;
  state.tradeMode = mode;
  state.tradeInputMode = 'UNITS';

  const isCrypto = asset.asset_type === 'CRYPTO';
  document.getElementById('tradeModalSymbol').textContent = `${isCrypto ? '🪙 ' : ''}${asset.symbol}`;
  document.getElementById('tradeModalName').textContent = asset.name;
  document.getElementById('tradeModalPrice').textContent = `£${formatPrice(asset.price)}`;

  const labelEl = document.getElementById('tradeUnitLabel');
  if (labelEl) labelEl.textContent = isCrypto ? 'Quantity (Coins / Units)' : 'Number of Shares';

  const inputEl = document.getElementById('tradeSharesInput');
  inputEl.step = isCrypto ? '0.0001' : '1';
  inputEl.value = isCrypto && asset.price > 1000 ? '0.05' : '1';

  setTradeMode(mode);
  updateTradeCalculation();

  document.getElementById('tradeModalBackdrop').classList.add('open');
}

function setTradeMode(mode) {
  state.tradeMode = mode;
  const buyBtn = document.getElementById('tradeModeBuy');
  const sellBtn = document.getElementById('tradeModeSell');
  const actionBtn = document.getElementById('tradeExecuteBtn');

  if (mode === 'BUY') {
    buyBtn.className = 'trade-mode-btn active buy-mode';
    sellBtn.className = 'trade-mode-btn';
    actionBtn.className = 'btn btn-primary';
    actionBtn.textContent = 'Confirm Buy Order';
  } else {
    sellBtn.className = 'trade-mode-btn active sell-mode';
    buyBtn.className = 'trade-mode-btn';
    actionBtn.className = 'btn btn-danger';
    actionBtn.textContent = 'Confirm Sell Order';
  }
  updateTradeCalculation();
}

function setTradePercent(pct) {
  if (!state.activeStock) return;
  const price = state.activeStock.price;
  const isCrypto = state.activeStock.asset_type === 'CRYPTO';

  if (state.tradeMode === 'BUY') {
    const cash = state.portfolio.cash_balance;
    const targetCash = cash * (pct / 100);
    const shares = targetCash / price;
    document.getElementById('tradeSharesInput').value = isCrypto ? shares.toFixed(4) : Math.floor(shares);
  } else {
    // Sell mode
    const holding = (state.portfolio.holdings || []).find(h => h.symbol === state.activeStock.symbol);
    const owned = holding ? holding.shares : 0;
    const targetShares = owned * (pct / 100);
    document.getElementById('tradeSharesInput').value = isCrypto ? targetShares.toFixed(4) : Math.floor(targetShares);
  }
  updateTradeCalculation();
}

function updateTradeCalculation() {
  if (!state.activeStock) return;

  const sharesInput = parseFloat(document.getElementById('tradeSharesInput').value) || 0;
  const price = state.activeStock.price;
  const isCrypto = state.activeStock.asset_type === 'CRYPTO';
  const total = round(sharesInput * price);

  const totalEl = document.getElementById('tradeTotalEstimate');
  const remainingCashEl = document.getElementById('tradeRemainingCash');
  const ownedHelpEl = document.getElementById('tradeOwnedHelp');

  if (totalEl) totalEl.textContent = `£${formatMoney(total)}`;

  const currentCash = state.portfolio.cash_balance;
  const holding = (state.portfolio.holdings || []).find(h => h.symbol === state.activeStock.symbol);
  const ownedShares = holding ? holding.shares : 0;

  if (state.tradeMode === 'BUY') {
    const afterCash = currentCash - total;
    if (remainingCashEl) {
      remainingCashEl.textContent = `£${formatMoney(Math.max(0, afterCash))}`;
      remainingCashEl.style.color = afterCash < 0 ? 'var(--accent-red)' : 'var(--text-primary)';
    }
    if (ownedHelpEl) {
      ownedHelpEl.textContent = `You own ${formatShares(ownedShares, isCrypto)}. Available cash: £${formatMoney(currentCash)}`;
    }
  } else {
    const afterCash = currentCash + total;
    if (remainingCashEl) {
      remainingCashEl.textContent = `£${formatMoney(afterCash)}`;
      remainingCashEl.style.color = 'var(--text-primary)';
    }
    if (ownedHelpEl) {
      ownedHelpEl.textContent = `You own ${formatShares(ownedShares, isCrypto)}. Selling up to ${formatShares(ownedShares, isCrypto)}.`;
    }
  }
}

async function executeTrade() {
  if (!state.user || !state.activeStock) return;

  const shares = parseFloat(document.getElementById('tradeSharesInput').value);
  if (!shares || shares <= 0) {
    showToast('Please enter a valid quantity.', 'error');
    return;
  }

  const symbol = state.activeStock.symbol;
  const mode = state.tradeMode;

  try {
    if (!state.isClientMode) {
      const endpoint = mode === 'BUY' ? '/api/trade/buy' : '/api/trade/sell';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, shares })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Trade failed.', 'error');
        return;
      }
      showToast(data.message, 'success');
    } else {
      executeClientTrade(symbol, shares, mode);
    }

    closeModal('tradeModalBackdrop');
    await loadPortfolio();
    await loadTransactions();
    renderApp();
  } catch (err) {
    showToast('Failed to complete order. Please try again.', 'error');
  }
}

function executeClientTrade(symbol, shares, mode) {
  const asset = state.stocksMap[symbol];
  const price = asset.price;
  const total = round(shares * price);
  const isCrypto = asset.asset_type === 'CRYPTO';

  const users = JSON.parse(localStorage.getItem('mustard_users') || '[]');
  const userIdx = users.findIndex(u => u.id === state.user.id);
  if (userIdx === -1) throw new Error('User not found');

  const portfolios = JSON.parse(localStorage.getItem('mustard_portfolios') || '{}');
  const userHoldings = portfolios[state.user.id] || [];
  const transactions = JSON.parse(localStorage.getItem('mustard_transactions') || '{}');
  const userTxs = transactions[state.user.id] || [];

  if (mode === 'BUY') {
    if (users[userIdx].cash_balance < total) {
      showToast(`Insufficient cash. Need £${formatMoney(total)} but have £${formatMoney(users[userIdx].cash_balance)}`, 'error');
      throw new Error('Insufficient cash');
    }

    users[userIdx].cash_balance = round(users[userIdx].cash_balance - total);
    state.user.cash_balance = users[userIdx].cash_balance;

    const existingIdx = userHoldings.findIndex(h => h.symbol === symbol);
    if (existingIdx >= 0) {
      const prev = userHoldings[existingIdx];
      const newShares = prev.shares + shares;
      const newCost = round(prev.total_invested + total);
      userHoldings[existingIdx] = {
        symbol,
        shares: newShares,
        total_invested: newCost,
        average_buy_price: round(newCost / newShares, 6)
      };
    } else {
      userHoldings.push({
        symbol,
        shares,
        total_invested: total,
        average_buy_price: price
      });
    }

    userTxs.unshift({
      id: Date.now(),
      type: 'BUY',
      symbol,
      stock_name: asset.name,
      shares,
      price_per_share: price,
      total_amount: total,
      realized_pnl: 0,
      created_at: new Date().toISOString()
    });

    showToast(`Bought ${formatShares(shares, isCrypto)} of ${symbol} for £${formatMoney(total)}!`, 'success');
  } else {
    // Sell
    const existingIdx = userHoldings.findIndex(h => h.symbol === symbol);
    if (existingIdx === -1 || userHoldings[existingIdx].shares < shares - 1e-6) {
      showToast('You do not own enough units to sell.', 'error');
      throw new Error('Not enough units');
    }

    const holding = userHoldings[existingIdx];
    const costBasis = round(shares * holding.average_buy_price);
    const pnl = round(total - costBasis);

    users[userIdx].cash_balance = round(users[userIdx].cash_balance + total);
    state.user.cash_balance = users[userIdx].cash_balance;

    const remainingShares = holding.shares - shares;
    if (remainingShares <= 0.000001) {
      userHoldings.splice(existingIdx, 1);
    } else {
      holding.shares = remainingShares;
      holding.total_invested = round(remainingShares * holding.average_buy_price);
    }

    userTxs.unshift({
      id: Date.now(),
      type: 'SELL',
      symbol,
      stock_name: asset.name,
      shares,
      price_per_share: price,
      total_amount: total,
      realized_pnl: pnl,
      created_at: new Date().toISOString()
    });

    showToast(`Sold ${formatShares(shares, isCrypto)} of ${symbol} for £${formatMoney(total)} (${pnl >= 0 ? '+' : ''}£${formatMoney(pnl)})`, 'success');
  }

  portfolios[state.user.id] = userHoldings;
  transactions[state.user.id] = userTxs;
  localStorage.setItem('mustard_users', JSON.stringify(users));
  localStorage.setItem('mustard_current_user', JSON.stringify(users[userIdx]));
  localStorage.setItem('mustard_portfolios', JSON.stringify(portfolios));
  localStorage.setItem('mustard_transactions', JSON.stringify(transactions));
}

// -----------------------------------------------------------------------------
// Stock Detail Modal
// -----------------------------------------------------------------------------
function openStockDetail(symbol) {
  const asset = state.stocksMap[symbol];
  if (!asset) return;

  const isCrypto = asset.asset_type === 'CRYPTO';
  document.getElementById('detailSymbol').textContent = `${isCrypto ? '🪙 ' : '🇬🇧 '}${asset.symbol}`;
  document.getElementById('detailName').textContent = asset.name;
  document.getElementById('detailSector').textContent = asset.sector;
  document.getElementById('detailPrice').textContent = `£${formatPrice(asset.price)}`;
  document.getElementById('detailDescription').textContent = asset.description;
  document.getElementById('detailRange').textContent = `£${formatPrice(asset.day_low)} - £${formatPrice(asset.day_high)}`;
  document.getElementById('detailVolume').textContent = (asset.volume || 1845000).toLocaleString();
  document.getElementById('detailSource').textContent = asset.source || 'Live Market Feed';

  const chartBox = document.getElementById('detailChart');
  if (chartBox) {
    chartBox.innerHTML = renderLargeChartSvg(asset.sparkline, asset.change_pct >= 0);
  }

  document.getElementById('detailTradeBtn').onclick = () => {
    closeModal('stockDetailModalBackdrop');
    openTradeModal(asset.symbol, 'BUY');
  };

  document.getElementById('stockDetailModalBackdrop').classList.add('open');
}

function renderLargeChartSvg(points, isUp) {
  if (!points || points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 420;
  const height = 140;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 24) - 12;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const strokeColor = isUp ? '#10b981' : '#ef4444';

  return `
    <svg style="width: 100%; height: 140px; overflow: visible;" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="0,${height} ${coords} ${width},${height}" fill="url(#chartGrad)"/>
      <polyline fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${coords}"/>
    </svg>
  `;
}

// -----------------------------------------------------------------------------
// Authentication Modal & State
// -----------------------------------------------------------------------------
function openAuthModal(view = 'register') {
  setAuthModalView(view);
  document.getElementById('authModalBackdrop').classList.add('open');
}

function setAuthModalView(view) {
  const isReg = view === 'register';
  document.getElementById('authModalTitle').textContent = isReg ? 'Create Your Account' : 'Sign In to Your Account';
  document.getElementById('authSubmitBtn').textContent = isReg ? 'Create Account (£10,000 Bonus)' : 'Sign In';
  document.getElementById('authSwitchPrompt').textContent = isReg ? 'Already have an account?' : 'Need an account?';
  document.getElementById('authSwitchLink').textContent = isReg ? 'Sign In' : 'Create Account';
  document.getElementById('authSwitchLink').onclick = () => setAuthModalView(isReg ? 'login' : 'register');

  const emailGroup = document.getElementById('authEmailGroup');
  const emailInput = document.getElementById('authEmail');
  if (emailGroup) emailGroup.style.display = isReg ? 'block' : 'none';
  if (emailInput) emailInput.disabled = !isReg;

  const usernameLabel = document.getElementById('authUsernameLabel');
  if (usernameLabel) usernameLabel.textContent = isReg ? 'Choose Username' : 'Username or Email Address';

  const bonusNotice = document.getElementById('authBonusNotice');
  if (bonusNotice) bonusNotice.style.display = isReg ? 'block' : 'none';

  const errorBox = document.getElementById('authErrorBox');
  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }

  document.getElementById('authModalBackdrop').dataset.mode = view;
  renderSavedAccountsList(isReg);
}

function renderSavedAccountsList(isReg) {
  const container = document.getElementById('savedAccountsContainer');
  const list = document.getElementById('savedAccountsList');
  if (!container || !list) return;

  if (isReg) {
    container.style.display = 'none';
    return;
  }

  const users = JSON.parse(localStorage.getItem('mustard_users') || '[]');
  if (users.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  list.innerHTML = users.map(u => `
    <button type="button" class="btn btn-secondary btn-sm" onclick="selectSavedAccount('${(u.username || '').replace(/'/g, "\\'")}')" style="font-size: 0.75rem; padding: 4px 9px;">
      👤 ${u.username} (£${formatMoney(u.cash_balance)})
    </button>
  `).join('');
}

function selectSavedAccount(username) {
  const users = JSON.parse(localStorage.getItem('mustard_users') || '[]');
  const u = users.find(x => x.username.toLowerCase() === username.toLowerCase());
  if (u) {
    document.getElementById('authUsername').value = u.username;
    if (u.password) {
      document.getElementById('authPassword').value = u.password;
    }
    const errorBox = document.getElementById('authErrorBox');
    if (errorBox) errorBox.style.display = 'none';
  }
}

function togglePasswordVisibility() {
  const pwdInput = document.getElementById('authPassword');
  const btn = document.getElementById('togglePwdBtn');
  if (!pwdInput) return;
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (btn) btn.textContent = '🔒 Hide';
  } else {
    pwdInput.type = 'password';
    if (btn) btn.textContent = '👁️ Show';
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const errorBox = document.getElementById('authErrorBox');
  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }

  const mode = document.getElementById('authModalBackdrop').dataset.mode || 'login';
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value.trim();
  const email = document.getElementById('authEmail').value.trim();

  if (!username || !password) {
    const msg = 'Please enter both username and password.';
    if (errorBox) { errorBox.textContent = msg; errorBox.style.display = 'block'; }
    showToast(msg, 'error');
    return;
  }

  try {
    if (!state.isClientMode) {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register' ? { username, email, password } : { login: username, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication error');
      }
      state.user = data.user;
      showToast(data.message, 'success');
    } else {
      handleClientAuth(mode, username, email, password);
    }

    closeModal('authModalBackdrop');
    updateAuthUI();
    await loadPortfolio();
    await loadTransactions();
    renderApp();
  } catch (err) {
    const errorMsg = err.message || 'Authentication failed.';
    if (errorBox) {
      errorBox.textContent = errorMsg;
      errorBox.style.display = 'block';
    }
    showToast(errorMsg, 'error');
  }
}

function handleClientAuth(mode, username, email, password) {
  const users = JSON.parse(localStorage.getItem('mustard_users') || '[]');

  if (mode === 'register') {
    const existing = users.find(u => (u.username || '').toLowerCase() === username.toLowerCase());
    if (existing) {
      throw new Error(`An account named "${username}" already exists. Please sign in instead.`);
    }

    const newUser = {
      id: Date.now(),
      username,
      email: email || `${username.toLowerCase()}@investor.local`,
      password,
      cash_balance: 10000.0,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('mustard_users', JSON.stringify(users));
    localStorage.setItem('mustard_current_user', JSON.stringify(newUser));
    state.user = newUser;
    showToast(`Account created! Welcome, ${username}. You have £10,000 ready to invest.`, 'success');
  } else {
    // Login
    const search = username.toLowerCase();
    const user = users.find(u => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      return uName === search || (uEmail && uEmail === search);
    });

    if (!user) {
      const available = users.map(u => u.username).filter(Boolean).join(', ');
      throw new Error(`Account "${username}" was not found. Registered accounts on this browser: ${available || 'None'}`);
    }

    if (user.password !== password) {
      throw new Error(`Incorrect password for account "${user.username}". Click "👁️ Show" to check what you typed.`);
    }

    localStorage.setItem('mustard_current_user', JSON.stringify(user));
    state.user = user;
    showToast(`Welcome back, ${user.username}!`, 'success');
  }
}

async function handleLogout() {
  if (!state.isClientMode) {
    await fetch('/api/auth/logout', { method: 'POST' });
  } else {
    localStorage.removeItem('mustard_current_user');
  }
  state.user = null;
  state.portfolio = {
    cash_balance: 10000.0,
    holdings_value: 0.0,
    total_portfolio_value: 10000.0,
    overall_pnl: 0.0,
    overall_pnl_pct: 0.0,
    holdings: []
  };
  state.transactions = [];
  updateAuthUI();
  renderApp();
  showToast('Logged out successfully.', 'info');
}

function updateAuthUI() {
  const guestNav = document.getElementById('guestNav');
  const userNav = document.getElementById('userNav');
  const avatarEl = document.getElementById('navAvatar');
  const usernameEl = document.getElementById('navUsername');

  if (state.user) {
    if (guestNav) guestNav.style.display = 'none';
    if (userNav) userNav.style.display = 'flex';
    if (avatarEl) avatarEl.textContent = state.user.username.charAt(0).toUpperCase();
    if (usernameEl) usernameEl.textContent = state.user.username;
  } else {
    if (guestNav) guestNav.style.display = 'flex';
    if (userNav) userNav.style.display = 'none';
  }
}

async function resetAccount() {
  if (!confirm('Are you sure you want to reset your account? Your portfolio will be wiped and your balance reset to £10,000.00.')) {
    return;
  }

  if (!state.isClientMode) {
    const res = await fetch('/api/portfolio/reset', { method: 'POST' });
    const data = await res.json();
    showToast(data.message, 'success');
  } else {
    const users = JSON.parse(localStorage.getItem('mustard_users') || '[]');
    const user = users.find(u => u.id === state.user.id);
    if (user) {
      user.cash_balance = 10000.0;
      localStorage.setItem('mustard_users', JSON.stringify(users));
      localStorage.setItem('mustard_current_user', JSON.stringify(user));
    }
    const portfolios = JSON.parse(localStorage.getItem('mustard_portfolios') || '{}');
    portfolios[state.user.id] = [];
    localStorage.setItem('mustard_portfolios', JSON.stringify(portfolios));
    showToast('Portfolio reset to initial £10,000.00 cash.', 'success');
  }

  await loadPortfolio();
  await loadTransactions();
  renderApp();
}

// -----------------------------------------------------------------------------
// UI Tabs & Events
// -----------------------------------------------------------------------------
function switchTab(tabName) {
  state.activeTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.getElementById('stocksTabContent').style.display = tabName === 'stocks' ? 'block' : 'none';
  document.getElementById('portfolioTabContent').style.display = tabName === 'portfolio' ? 'block' : 'none';
  document.getElementById('historyTabContent').style.display = tabName === 'history' ? 'block' : 'none';
  document.getElementById('leaderboardTabContent').style.display = tabName === 'leaderboard' ? 'block' : 'none';

  if (tabName === 'stocks') renderStocksTable();
  if (tabName === 'portfolio') renderHoldingsTable();
  if (tabName === 'history') renderHistoryTable();
  if (tabName === 'leaderboard') loadLeaderboard();
}

function setupEventListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeSector = pill.dataset.sector;
      renderStocksTable();
    });
  });

  const searchInput = document.getElementById('stockSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderStocksTable();
    });
  }

  const sharesInput = document.getElementById('tradeSharesInput');
  if (sharesInput) {
    sharesInput.addEventListener('input', updateTradeCalculation);
  }

  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// -----------------------------------------------------------------------------
// Utilities & Formatting
// -----------------------------------------------------------------------------
function formatPrice(price) {
  if (price === undefined || price === null) return '0.00';
  if (price < 1.0) {
    return price.toLocaleString('en-GB', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
  return price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoney(amount) {
  return (amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatShares(shares, isCrypto = false) {
  if (!shares) return '0';
  if (isCrypto) {
    // Show up to 6 decimals, strip trailing zeroes
    return parseFloat(shares.toFixed(6)).toString();
  }
  return Number.isInteger(shares) ? shares.toLocaleString('en-GB') : shares.toFixed(4);
}

function round(val, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Full Market Fallback Universe (Equities + Crypto)
function getSimulatedMarketAssets() {
  const baseList = [
    // UK Stocks
    { symbol: 'AZN.L', name: 'AstraZeneca PLC', sector: 'Healthcare', asset_type: 'STOCK', price: 140.50, description: 'Global biopharma company.' },
    { symbol: 'SHEL.L', name: 'Shell PLC', sector: 'Energy', asset_type: 'STOCK', price: 37.50, description: 'Multinational energy giant.' },
    { symbol: 'HSBA.L', name: 'HSBC Holdings PLC', sector: 'Financials', asset_type: 'STOCK', price: 13.60, description: 'Global banking provider.' },
    { symbol: 'ULVR.L', name: 'Unilever PLC', sector: 'Consumer Goods', asset_type: 'STOCK', price: 50.20, description: 'Consumer household products.' },
    { symbol: 'BP.L', name: 'BP PLC', sector: 'Energy', asset_type: 'STOCK', price: 5.75, description: 'Energy & biofuels exploration.' },
    { symbol: 'RR.L', name: 'Rolls-Royce Holdings', sector: 'Aerospace & Defence', asset_type: 'STOCK', price: 13.65, description: 'Aviation and propulsion leader.' },
    { symbol: 'GSK.L', name: 'GSK PLC', sector: 'Healthcare', asset_type: 'STOCK', price: 19.30, description: 'Vaccines and medicines.' },
    { symbol: 'BA.L', name: 'BAE Systems PLC', sector: 'Aerospace & Defence', asset_type: 'STOCK', price: 19.30, description: 'Defence and security solutions.' },
    { symbol: 'BARC.L', name: 'Barclays PLC', sector: 'Financials', asset_type: 'STOCK', price: 4.30, description: 'Major retail and investment bank.' },
    { symbol: 'TSCO.L', name: 'Tesco PLC', sector: 'Consumer Goods', asset_type: 'STOCK', price: 5.65, description: 'Britains largest supermarket.' },
    { symbol: 'RIO.L', name: 'Rio Tinto PLC', sector: 'Basic Materials', asset_type: 'STOCK', price: 62.20, description: 'Global metals and mining.' },
    { symbol: 'GLEN.L', name: 'Glencore PLC', sector: 'Basic Materials', asset_type: 'STOCK', price: 5.05, description: 'Natural resources powerhouse.' },
    { symbol: 'LSEG.L', name: 'London Stock Exchange Group', sector: 'Financials', asset_type: 'STOCK', price: 98.20, description: 'Financial markets infrastructure.' },
    { symbol: 'NWG.L', name: 'NatWest Group PLC', sector: 'Financials', asset_type: 'STOCK', price: 6.00, description: 'High street commercial banking.' },
    { symbol: 'LLOY.L', name: 'Lloyds Banking Group', sector: 'Financials', asset_type: 'STOCK', price: 1.00, description: 'Leading UK mortgage & consumer bank.' },
    { symbol: 'VOD.L', name: 'Vodafone Group PLC', sector: 'Telecommunications', asset_type: 'STOCK', price: 1.20, description: 'Global telecoms & mobile network.' },
    { symbol: 'DGE.L', name: 'Diageo PLC', sector: 'Consumer Goods', asset_type: 'STOCK', price: 19.35, description: 'World leader in beverages.' },
    { symbol: 'NG.L', name: 'National Grid PLC', sector: 'Utilities', asset_type: 'STOCK', price: 12.80, description: 'Energy transmission utility.' },

    // Cryptocurrencies
    { symbol: 'BTC-GBP', name: 'Bitcoin', sector: 'Crypto', asset_type: 'CRYPTO', price: 48800.0, description: 'The leading decentralized cryptocurrency.' },
    { symbol: 'ETH-GBP', name: 'Ethereum', sector: 'Crypto', asset_type: 'CRYPTO', price: 1370.0, description: 'Smart contracts and decentralized finance.' },
    { symbol: 'SOL-GBP', name: 'Solana', sector: 'Crypto', asset_type: 'CRYPTO', price: 54.0, description: 'Ultra-fast layer-1 smart contracts platform.' },
    { symbol: 'XRP-GBP', name: 'XRP', sector: 'Crypto', asset_type: 'CRYPTO', price: 0.72, description: 'Cross-border digital settlement token.' },
    { symbol: 'BNB-GBP', name: 'BNB', sector: 'Crypto', asset_type: 'CRYPTO', price: 450.0, description: 'Ecosystem token of BNB Chain.' },
    { symbol: 'DOGE-GBP', name: 'Dogecoin', sector: 'Crypto', asset_type: 'CRYPTO', price: 0.12, description: 'Peer-to-peer open source internet currency.' },
    { symbol: 'ADA-GBP', name: 'Cardano', sector: 'Crypto', asset_type: 'CRYPTO', price: 0.45, description: 'Proof-of-stake blockchain network.' },
    { symbol: 'AVAX-GBP', name: 'Avalanche', sector: 'Crypto', asset_type: 'CRYPTO', price: 22.0, description: 'Scalable smart contracts and enterprise subnets.' }
  ];

  return baseList.map(item => {
    const prev = state.stocksMap[item.symbol] ? state.stocksMap[item.symbol].price : item.price;
    const tick = (Math.random() - 0.495) * (item.asset_type === 'CRYPTO' ? 0.008 : 0.003);
    const rawPrice = Math.max(0.01, prev * (1 + tick));
    const price = round(rawPrice, item.price < 1.0 ? 4 : 2);
    const chg_pct = round(((price - item.price) / item.price) * 100);
    const day_high = round(Math.max(price, item.price * 1.025), item.price < 1.0 ? 4 : 2);
    const day_low = round(min = Math.min(price, item.price * 0.975), item.price < 1.0 ? 4 : 2);

    const spark = [];
    const base = price * (1 - chg_pct / 100);
    for (let i = 0; i < 10; i++) {
      spark.push(round(base + (price - base) * (i / 9) + (Math.random() - 0.5) * (price * 0.01), item.price < 1.0 ? 4 : 2));
    }

    return {
      ...item,
      price,
      change_pct: chg_pct,
      day_high,
      day_low,
      volume: Math.floor(Math.random() * 5000000) + 1200000,
      sparkline: spark,
      source: 'Live Feed'
    };
  });
}
