/**
 * Mustard Investments UK - Interactive Frontend Engine
 * Supports both Flask Backend API and GitHub Pages Client Mode.
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
  // Initialize local demo storage
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
      // In Client mode or offline fallback, generate or update simulated live UK stocks
      stocks = getSimulatedUKStocks();
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
        const stock = state.stocksMap[h.symbol] || { price: h.average_buy_price, name: h.symbol };
        const curVal = round(h.shares * stock.price);
        const pnl = round(curVal - h.total_invested);
        const pnl_pct = h.total_invested > 0 ? round((pnl / h.total_invested) * 100) : 0;
        holdingsVal += curVal;
        return {
          symbol: h.symbol,
          name: stock.name,
          shares: h.shares,
          average_buy_price: h.average_buy_price,
          current_price: stock.price,
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
    return `
      <div class="ticker-item" onclick="openTradeModal('${s.symbol}', 'BUY')">
        <span class="ticker-sym">${s.symbol}</span>
        <span class="ticker-price">£${s.price.toFixed(2)}</span>
        <span class="${isUp ? 'up' : 'down'}">${sign}${s.change_pct.toFixed(2)}%</span>
      </div>
    `;
  }).join('');

  // Duplicate for seamless infinite marquee loop
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

  const filtered = state.stocks.filter(s => {
    const matchesSector = state.activeSector === 'ALL' || s.sector.toUpperCase() === state.activeSector.toUpperCase();
    const query = state.searchQuery.toLowerCase();
    const matchesSearch = s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query);
    return matchesSector && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No UK stocks found</h3>
          <p>Try searching for a different company name or clearing the sector filter.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const isUp = s.change_pct >= 0;
    const sign = isUp ? '+' : '';
    const flashClass = s.flash === 'up' ? 'price-flash-up' : (s.flash === 'down' ? 'price-flash-down' : '');

    return `
      <tr class="${flashClass}" id="stock-row-${s.symbol}">
        <td>
          <div class="stock-cell">
            <div>
              <div class="stock-symbol-tag">${s.symbol}</div>
              <div class="stock-subname" title="${s.name}">${s.name}</div>
            </div>
          </div>
        </td>
        <td><span class="sector-tag">${s.sector}</span></td>
        <td class="price-cell">£${s.price.toFixed(2)}</td>
        <td>
          <span class="change-badge ${isUp ? 'up' : 'down'}">
            ${isUp ? '▲' : '▼'} ${sign}${s.change_pct.toFixed(2)}%
          </span>
        </td>
        <td style="color: var(--text-secondary); font-size: 0.8rem;">
          £${s.day_low.toFixed(2)} - £${s.day_high.toFixed(2)}
        </td>
        <td>${renderSparklineSvg(s.sparkline, isUp)}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="openStockDetail('${s.symbol}')">Details</button>
            <button class="btn btn-primary btn-sm" onclick="openTradeModal('${s.symbol}', 'BUY')">Invest</button>
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
      if (priceCell) priceCell.textContent = `£${s.price.toFixed(2)}`;

      const badge = row.querySelector('.change-badge');
      if (badge) {
        const isUp = s.change_pct >= 0;
        badge.className = `change-badge ${isUp ? 'up' : 'down'}`;
        badge.innerHTML = `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${s.change_pct.toFixed(2)}%`;
      }

      if (s.flash) {
        row.classList.remove('price-flash-up', 'price-flash-down');
        void row.offsetWidth; // trigger reflow
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
        <p>You have £${formatMoney(state.portfolio.cash_balance)} in cash ready to invest in British stocks.</p>
        <button class="btn btn-primary" onclick="switchTab('stocks')">Explore UK Stocks</button>
      </div>
    `;
    return;
  }

  const rows = holdings.map(h => {
    const isUp = h.pnl >= 0;
    const sign = isUp ? '+' : '';
    return `
      <tr>
        <td>
          <div class="stock-symbol-tag">${h.symbol}</div>
          <div class="stock-subname">${h.name}</div>
        </td>
        <td><strong>${h.shares.toLocaleString()}</strong></td>
        <td>£${h.average_buy_price.toFixed(2)}</td>
        <td>£${h.current_price.toFixed(2)}</td>
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
            <th>Stock</th>
            <th>Shares Owned</th>
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
        <p>Buy or sell UK stocks to see your historical order book here.</p>
      </div>
    `;
    return;
  }

  const rows = txs.map(t => {
    const isBuy = t.type === 'BUY';
    const isSell = t.type === 'SELL';
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
        <td>${t.shares ? t.shares.toLocaleString() : '—'}</td>
        <td>£${t.price_per_share ? t.price_per_share.toFixed(2) : '—'}</td>
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
            <th>Shares</th>
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
// Trading Engine Modal
// -----------------------------------------------------------------------------
function openTradeModal(symbol, mode = 'BUY') {
  if (!state.user) {
    openAuthModal('login');
    showToast('Please sign in or create an account to start investing.', 'info');
    return;
  }

  const stock = state.stocksMap[symbol];
  if (!stock) return;

  state.activeStock = stock;
  state.tradeMode = mode;

  document.getElementById('tradeModalSymbol').textContent = stock.symbol;
  document.getElementById('tradeModalName').textContent = stock.name;
  document.getElementById('tradeModalPrice').textContent = `£${stock.price.toFixed(2)}`;

  setTradeMode(mode);
  document.getElementById('tradeSharesInput').value = '1';
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

  if (state.tradeMode === 'BUY') {
    const cash = state.portfolio.cash_balance;
    const maxShares = Math.floor(cash / price);
    const target = Math.max(1, Math.floor(maxShares * (pct / 100)));
    document.getElementById('tradeSharesInput').value = target;
  } else {
    // Sell mode
    const holding = (state.portfolio.holdings || []).find(h => h.symbol === state.activeStock.symbol);
    const owned = holding ? holding.shares : 0;
    const target = Math.max(1, Math.floor(owned * (pct / 100)));
    document.getElementById('tradeSharesInput').value = target;
  }
  updateTradeCalculation();
}

function updateTradeCalculation() {
  if (!state.activeStock) return;

  const sharesInput = parseFloat(document.getElementById('tradeSharesInput').value) || 0;
  const price = state.activeStock.price;
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
      ownedHelpEl.textContent = `You own ${ownedShares} shares. Available cash: £${formatMoney(currentCash)}`;
    }
  } else {
    const afterCash = currentCash + total;
    if (remainingCashEl) {
      remainingCashEl.textContent = `£${formatMoney(afterCash)}`;
      remainingCashEl.style.color = 'var(--text-primary)';
    }
    if (ownedHelpEl) {
      ownedHelpEl.textContent = `You own ${ownedShares} shares. Selling up to ${ownedShares} shares.`;
    }
  }
}

async function executeTrade() {
  if (!state.user || !state.activeStock) return;

  const shares = parseFloat(document.getElementById('tradeSharesInput').value);
  if (!shares || shares <= 0) {
    showToast('Please enter a valid share quantity.', 'error');
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
      // Execute in Client mode
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
  const stock = state.stocksMap[symbol];
  const price = stock.price;
  const total = round(shares * price);

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
        average_buy_price: round(newCost / newShares)
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
      stock_name: stock.name,
      shares,
      price_per_share: price,
      total_amount: total,
      realized_pnl: 0,
      created_at: new Date().toISOString()
    });

    showToast(`Bought ${shares} shares of ${symbol} for £${formatMoney(total)}!`, 'success');
  } else {
    // Sell
    const existingIdx = userHoldings.findIndex(h => h.symbol === symbol);
    if (existingIdx === -1 || userHoldings[existingIdx].shares < shares) {
      showToast('You do not own enough shares to sell.', 'error');
      throw new Error('Not enough shares');
    }

    const holding = userHoldings[existingIdx];
    const costBasis = round(shares * holding.average_buy_price);
    const pnl = round(total - costBasis);

    users[userIdx].cash_balance = round(users[userIdx].cash_balance + total);
    state.user.cash_balance = users[userIdx].cash_balance;

    const remainingShares = holding.shares - shares;
    if (remainingShares <= 0.0001) {
      userHoldings.splice(existingIdx, 1);
    } else {
      holding.shares = remainingShares;
      holding.total_invested = round(remainingShares * holding.average_buy_price);
    }

    userTxs.unshift({
      id: Date.now(),
      type: 'SELL',
      symbol,
      stock_name: stock.name,
      shares,
      price_per_share: price,
      total_amount: total,
      realized_pnl: pnl,
      created_at: new Date().toISOString()
    });

    showToast(`Sold ${shares} shares of ${symbol} for £${formatMoney(total)} (${pnl >= 0 ? '+' : ''}£${formatMoney(pnl)})`, 'success');
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
  const stock = state.stocksMap[symbol];
  if (!stock) return;

  document.getElementById('detailSymbol').textContent = stock.symbol;
  document.getElementById('detailName').textContent = stock.name;
  document.getElementById('detailSector').textContent = stock.sector;
  document.getElementById('detailPrice').textContent = `£${stock.price.toFixed(2)}`;
  document.getElementById('detailDescription').textContent = stock.description;
  document.getElementById('detailRange').textContent = `£${stock.day_low.toFixed(2)} - £${stock.day_high.toFixed(2)}`;
  document.getElementById('detailVolume').textContent = (stock.volume || 1845000).toLocaleString();
  document.getElementById('detailSource').textContent = stock.source || 'LSE Live Delayed';

  const chartBox = document.getElementById('detailChart');
  if (chartBox) {
    chartBox.innerHTML = renderLargeChartSvg(stock.sparkline, stock.change_pct >= 0);
  }

  document.getElementById('detailTradeBtn').onclick = () => {
    closeModal('stockDetailModalBackdrop');
    openTradeModal(stock.symbol, 'BUY');
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
  const fillColor = isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';

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
  document.getElementById('authModalTitle').textContent = isReg ? 'Create Your Account' : 'Sign In to Mustard';
  document.getElementById('authSubmitBtn').textContent = isReg ? 'Create Account (£10,000 Bonus)' : 'Sign In';
  document.getElementById('authSwitchPrompt').textContent = isReg ? 'Already have an account?' : 'Need an account?';
  document.getElementById('authSwitchLink').textContent = isReg ? 'Sign In' : 'Create Account';
  document.getElementById('authSwitchLink').onclick = () => setAuthModalView(isReg ? 'login' : 'register');
  document.getElementById('authEmailGroup').style.display = isReg ? 'block' : 'none';
  document.getElementById('authModalBackdrop').dataset.mode = view;
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const mode = document.getElementById('authModalBackdrop').dataset.mode || 'login';
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value.trim();
  const email = document.getElementById('authEmail').value.trim();

  if (!username || !password) {
    showToast('Please fill in all required fields.', 'error');
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
        showToast(data.error || 'Authentication error', 'error');
        return;
      }
      state.user = data.user;
      showToast(data.message, 'success');
    } else {
      // Client mode authentication
      handleClientAuth(mode, username, email, password);
    }

    closeModal('authModalBackdrop');
    updateAuthUI();
    await loadPortfolio();
    await loadTransactions();
    renderApp();
  } catch (err) {
    showToast(err.message || 'Authentication failed.', 'error');
  }
}

function handleClientAuth(mode, username, email, password) {
  const users = JSON.parse(localStorage.getItem('mustard_users') || '[]');

  if (mode === 'register') {
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already taken.');
    }
    const newUser = {
      id: Date.now(),
      username,
      email: email || `${username.toLowerCase()}@mustard.co.uk`,
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
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Invalid username or password.');
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
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Sector Pills
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeSector = pill.dataset.sector;
      renderStocksTable();
    });
  });

  // Search input
  const searchInput = document.getElementById('stockSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderStocksTable();
    });
  }

  // Trade quantity input
  const sharesInput = document.getElementById('tradeSharesInput');
  if (sharesInput) {
    sharesInput.addEventListener('input', updateTradeCalculation);
  }

  // Auth Form
  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }

  // Close modals on backdrop click
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
// Utilities & Fallback Data
// -----------------------------------------------------------------------------
function formatMoney(amount) {
  return (amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function round(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
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

// UK Stocks Master Fallback for Static GitHub Pages
function getSimulatedUKStocks() {
  const baseList = [
    { symbol: 'AZN.L', name: 'AstraZeneca PLC', sector: 'Healthcare', price: 140.50, description: 'Global biopharma company.' },
    { symbol: 'SHEL.L', name: 'Shell PLC', sector: 'Energy', price: 37.50, description: 'Multinational energy giant.' },
    { symbol: 'HSBA.L', name: 'HSBC Holdings PLC', sector: 'Financials', price: 13.60, description: 'Global banking provider.' },
    { symbol: 'ULVR.L', name: 'Unilever PLC', sector: 'Consumer Goods', price: 50.20, description: 'Consumer household products.' },
    { symbol: 'BP.L', name: 'BP PLC', sector: 'Energy', price: 5.75, description: 'Energy & biofuels exploration.' },
    { symbol: 'RR.L', name: 'Rolls-Royce Holdings', sector: 'Aerospace', price: 13.65, description: 'Aviation and propulsion leader.' },
    { symbol: 'GSK.L', name: 'GSK PLC', sector: 'Healthcare', price: 19.30, description: 'Vaccines and medicines.' },
    { symbol: 'BA.L', name: 'BAE Systems PLC', sector: 'Aerospace', price: 19.30, description: 'Defence and security solutions.' },
    { symbol: 'BARC.L', name: 'Barclays PLC', sector: 'Financials', price: 4.30, description: 'Major retail and investment bank.' },
    { symbol: 'TSCO.L', name: 'Tesco PLC', sector: 'Consumer Goods', price: 5.65, description: 'Britains largest supermarket.' },
    { symbol: 'RIO.L', name: 'Rio Tinto PLC', sector: 'Basic Materials', price: 62.20, description: 'Global metals and mining.' },
    { symbol: 'GLEN.L', name: 'Glencore PLC', sector: 'Basic Materials', price: 5.05, description: 'Natural resources powerhouse.' },
    { symbol: 'LSEG.L', name: 'London Stock Exchange Group', sector: 'Financials', price: 98.20, description: 'Financial markets infrastructure.' },
    { symbol: 'NWG.L', name: 'NatWest Group PLC', sector: 'Financials', price: 6.00, description: 'High street commercial banking.' },
    { symbol: 'LLOY.L', name: 'Lloyds Banking Group', sector: 'Financials', price: 1.00, description: 'Leading UK mortgage & consumer bank.' },
    { symbol: 'VOD.L', name: 'Vodafone Group PLC', sector: 'Telecommunications', price: 1.20, description: 'Global telecoms & mobile network.' },
    { symbol: 'DGE.L', name: 'Diageo PLC', sector: 'Consumer Goods', price: 19.35, description: 'World leader in beverages.' },
    { symbol: 'NG.L', name: 'National Grid PLC', sector: 'Utilities', price: 12.80, description: 'Energy transmission utility.' }
  ];

  return baseList.map(item => {
    const prev = state.stocksMap[item.symbol] ? state.stocksMap[item.symbol].price : item.price;
    const tick = (Math.random() - 0.495) * 0.003;
    const price = round(Math.max(0.10, prev * (1 + tick)));
    const chg_pct = round(((price - item.price) / item.price) * 100);
    const day_high = round(Math.max(price, item.price * 1.018));
    const day_low = round(Math.min(price, item.price * 0.982));

    const spark = [];
    const base = price * (1 - chg_pct / 100);
    for (let i = 0; i < 10; i++) {
      spark.push(round(base + (price - base) * (i / 9) + (Math.random() - 0.5) * 0.15));
    }

    return {
      ...item,
      price,
      change_pct: chg_pct,
      day_high,
      day_low,
      volume: Math.floor(Math.random() * 5000000) + 1200000,
      sparkline: spark,
      source: 'LSE Simulation'
    };
  });
}
