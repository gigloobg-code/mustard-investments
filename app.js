/**
 * ==============================================================================
 * Mustard Investments - Core Application Logic
 * Full-fidelity Paper Trading Simulator & Virtual Portfolio Engine
 * ==============================================================================
 */

// --- Default Asset Universe (Embedded for zero-CORS file:// compatibility) ---
const INITIAL_ASSETS = [
  {
    symbol: "RR.L",
    name: "Rolls-Royce Holdings plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 5.48,
    change: 0.18,
    changePercent: 3.40,
    marketCap: "£46.2B",
    peRatio: 28.4,
    dividend: "1.2%",
    range52: "£2.80 - £5.80",
    tags: ["Aerospace", "Defence", "UK Leader"],
    ethical: { halal: false, esgScore: "AA", faithAligned: true },
    description: "Rolls-Royce is a British multinational aerospace and defence company headquartered in London. It is the world's second-largest maker of aircraft engines."
  },
  {
    symbol: "SHEL.L",
    name: "Shell plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 27.15,
    change: -0.35,
    changePercent: -1.27,
    marketCap: "£172.5B",
    peRatio: 11.2,
    dividend: "3.8%",
    range52: "£23.50 - £29.40",
    tags: ["Energy", "Oil & Gas", "Dividends"],
    ethical: { halal: true, esgScore: "A", faithAligned: true },
    description: "Shell plc is a British multinational oil and gas company headquartered in London, England, exploring renewable energy and global LNG supply."
  },
  {
    symbol: "AZN.L",
    name: "AstraZeneca plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 118.20,
    change: 1.40,
    changePercent: 1.20,
    marketCap: "£183.1B",
    peRatio: 34.6,
    dividend: "2.1%",
    range52: "£97.50 - £133.00",
    tags: ["Pharmaceuticals", "Healthcare", "BioTech"],
    ethical: { halal: true, esgScore: "AAA", faithAligned: true },
    description: "AstraZeneca is a British-Swedish multinational pharmaceutical and biotechnology company based at Cambridge Biomedical Campus."
  },
  {
    symbol: "HSBA.L",
    name: "HSBC Holdings plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 7.12,
    change: 0.08,
    changePercent: 1.14,
    marketCap: "£133.8B",
    peRatio: 7.4,
    dividend: "6.9%",
    range52: "£5.70 - £7.35",
    tags: ["Banking", "Financial Services", "High Yield"],
    ethical: { halal: false, esgScore: "A", faithAligned: false },
    description: "HSBC Holdings plc is a British universal bank and financial services group, the largest bank in Europe by total assets."
  },
  {
    symbol: "BARC.L",
    name: "Barclays plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 2.45,
    change: 0.03,
    changePercent: 1.24,
    marketCap: "£36.8B",
    peRatio: 6.8,
    dividend: "4.1%",
    range52: "£1.38 - £2.60",
    tags: ["Banking", "UK Finance"],
    ethical: { halal: false, esgScore: "BBB", faithAligned: false },
    description: "Barclays is a British multinational universal bank headquartered in London, operating consumer banking and global investment banking."
  },
  {
    symbol: "BP.L",
    name: "BP plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 3.96,
    change: -0.04,
    changePercent: -1.00,
    marketCap: "£65.4B",
    peRatio: 10.5,
    dividend: "5.3%",
    range52: "£3.80 - £5.40",
    tags: ["Energy", "Renewables & Oil"],
    ethical: { halal: true, esgScore: "A", faithAligned: true },
    description: "BP plc is a British multinational oil and gas company headquartered in London, undergoing strategic transformation into integrated energy."
  },
  {
    symbol: "TSCO.L",
    name: "Tesco plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 3.52,
    change: 0.02,
    changePercent: 0.57,
    marketCap: "£24.6B",
    peRatio: 13.9,
    dividend: "3.5%",
    range52: "£2.65 - £3.65",
    tags: ["Retail", "Supermarket", "Consumer Staples"],
    ethical: { halal: true, esgScore: "AA", faithAligned: true },
    description: "Tesco plc is a British multinational groceries and general merchandise retailer, the market leader of groceries in the United Kingdom."
  },
  {
    symbol: "LLOY.L",
    name: "Lloyds Banking Group",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 0.58,
    change: 0.01,
    changePercent: 1.75,
    marketCap: "£36.5B",
    peRatio: 7.9,
    dividend: "5.2%",
    range52: "£0.40 - £0.62",
    tags: ["Mortgages", "Retail Banking"],
    ethical: { halal: false, esgScore: "A", faithAligned: false },
    description: "Lloyds Banking Group is a leading UK-based financial services group providing retail and commercial banking, pensions, and insurance."
  },
  {
    symbol: "VOD.L",
    name: "Vodafone Group plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 0.72,
    change: -0.01,
    changePercent: -1.37,
    marketCap: "£19.2B",
    peRatio: 12.1,
    dividend: "7.8%",
    range52: "£0.64 - £0.82",
    tags: ["Telecoms", "5G Infrastructure"],
    ethical: { halal: true, esgScore: "AA", faithAligned: true },
    description: "Vodafone Group is a British multinational telecommunications company operating mobile networks and broadband across Europe and Africa."
  },
  {
    symbol: "OCDO.L",
    name: "Ocado Group plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 3.75,
    change: 0.18,
    changePercent: 5.04,
    marketCap: "£3.1B",
    peRatio: null,
    dividend: "0.0%",
    range52: "£2.80 - £7.20",
    tags: ["E-Commerce", "Robotics", "High Beta"],
    ethical: { halal: true, esgScore: "A", faithAligned: true },
    description: "Ocado Group is a UK-based technology company licencing its grocery automated warehouse robotics (Ocado Smart Platform) worldwide."
  },
  {
    symbol: "NWG.L",
    name: "NatWest Group plc",
    category: "FTSE 100",
    country: "UK",
    currency: "GBP",
    price: 3.78,
    change: 0.05,
    changePercent: 1.34,
    marketCap: "£31.4B",
    peRatio: 7.1,
    dividend: "4.8%",
    range52: "£1.95 - £3.90",
    tags: ["Banking", "Commercial Lending"],
    ethical: { halal: false, esgScore: "A", faithAligned: false },
    description: "NatWest Group is a major UK banking and financial services company, serving millions of personal and business customers."
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "US Tech",
    country: "US",
    currency: "USD",
    price: 224.50,
    change: 3.20,
    changePercent: 1.45,
    marketCap: "$3.42T",
    peRatio: 33.8,
    dividend: "0.5%",
    range52: "$164.08 - $237.23",
    tags: ["Hardware", "AI", "Consumer Tech"],
    ethical: { halal: true, esgScore: "AAA", faithAligned: true },
    description: "Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, alongside services."
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    category: "US Tech",
    country: "US",
    currency: "USD",
    price: 412.30,
    change: 4.80,
    changePercent: 1.18,
    marketCap: "$3.06T",
    peRatio: 35.2,
    dividend: "0.8%",
    range52: "$344.00 - $468.35",
    tags: ["Cloud", "AI", "Enterprise Software"],
    ethical: { halal: true, esgScore: "AAA", faithAligned: true },
    description: "Microsoft produces computer software, consumer electronics, and cloud computing services including Azure and Microsoft 365."
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    category: "US Tech",
    country: "US",
    currency: "USD",
    price: 139.80,
    change: 5.40,
    changePercent: 4.02,
    marketCap: "$3.43T",
    peRatio: 54.6,
    dividend: "0.1%",
    range52: "$45.00 - $144.40",
    tags: ["Semiconductors", "Generative AI", "Growth"],
    ethical: { halal: true, esgScore: "AA", faithAligned: true },
    description: "Nvidia designs graphics processing units (GPUs) and system on a chip units for high-performance computing and modern Artificial Intelligence."
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    category: "US Tech",
    country: "US",
    currency: "USD",
    price: 252.10,
    change: -6.20,
    changePercent: -2.40,
    marketCap: "$804.5B",
    peRatio: 68.2,
    dividend: "0.0%",
    range52: "$138.80 - $271.00",
    tags: ["EVs", "Robotics", "Clean Energy"],
    ethical: { halal: true, esgScore: "A", faithAligned: true },
    description: "Tesla designs and manufactures electric vehicles, battery energy storage systems, solar panels, and humanoid robotics."
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    category: "US Tech",
    country: "US",
    currency: "USD",
    price: 198.40,
    change: 2.10,
    changePercent: 1.07,
    marketCap: "$2.07T",
    peRatio: 42.1,
    dividend: "0.0%",
    range52: "$118.35 - $201.20",
    tags: ["E-Commerce", "AWS Cloud", "Logistics"],
    ethical: { halal: true, esgScore: "AA", faithAligned: true },
    description: "Amazon focuses on e-commerce, cloud computing (AWS), online advertising, digital streaming, and artificial intelligence."
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    category: "US Tech",
    country: "US",
    currency: "USD",
    price: 172.60,
    change: 1.15,
    changePercent: 0.67,
    marketCap: "$2.14T",
    peRatio: 24.3,
    dividend: "0.5%",
    range52: "$120.21 - $191.75",
    tags: ["Search", "Cloud", "Gemini AI"],
    ethical: { halal: true, esgScore: "AA", faithAligned: true },
    description: "Alphabet is the parent company of Google, YouTube, Android, Chrome, Waymo, and Google Cloud."
  },
  {
    symbol: "BTC-USD",
    name: "Bitcoin",
    category: "Crypto",
    country: "Global",
    currency: "USD",
    price: 71450.00,
    change: 1820.00,
    changePercent: 2.61,
    marketCap: "$1.41T",
    peRatio: null,
    dividend: "0.0%",
    range52: "$34,500 - $73,750",
    tags: ["Store of Value", "Digital Gold", "Crypto"],
    ethical: { halal: true, esgScore: "B", faithAligned: true },
    description: "Bitcoin is the pioneering decentralized cryptocurrency based on proof-of-work blockchain ledger technology."
  },
  {
    symbol: "ETH-USD",
    name: "Ethereum",
    category: "Crypto",
    country: "Global",
    currency: "USD",
    price: 2680.00,
    change: 85.00,
    changePercent: 3.28,
    marketCap: "$322.8B",
    peRatio: null,
    dividend: "3.1% (Staking)",
    range52: "$1,780 - $4,090",
    tags: ["Smart Contracts", "DeFi", "Web3"],
    ethical: { halal: true, esgScore: "A", faithAligned: true },
    description: "Ethereum is a decentralized open-source blockchain with smart contract functionality, powering the global decentralized finance ecosystem."
  },
  {
    symbol: "SOL-USD",
    name: "Solana",
    category: "Crypto",
    country: "Global",
    currency: "USD",
    price: 185.20,
    change: 9.40,
    changePercent: 5.35,
    marketCap: "$86.5B",
    peRatio: null,
    dividend: "6.4% (Staking)",
    range52: "$38.00 - $210.00",
    tags: ["High Speed L1", "Crypto", "High Beta"],
    ethical: { halal: true, esgScore: "A", faithAligned: true },
    description: "Solana is a high-performance proof-of-stake blockchain designed for widespread, mainstream adoption and instant transactions."
  },
  {
    symbol: "VUSA.L",
    name: "Vanguard S&P 500 UCITS ETF",
    category: "ETFs & Indices",
    country: "UK/US",
    currency: "GBP",
    price: 89.40,
    change: 0.65,
    changePercent: 0.73,
    marketCap: "£48.1B",
    peRatio: 27.2,
    dividend: "1.4%",
    range52: "£72.10 - £91.80",
    tags: ["Index Fund", "Diversified", "US Top 500"],
    ethical: { halal: false, esgScore: "AA", faithAligned: true },
    description: "Tracks the performance of the S&P 500 Index, representing 500 of the largest publicly traded companies in the United States."
  },
  {
    symbol: "ISF.L",
    name: "iShares Core FTSE 100 UCITS ETF",
    category: "ETFs & Indices",
    country: "UK",
    currency: "GBP",
    price: 8.42,
    change: 0.04,
    changePercent: 0.48,
    marketCap: "£14.2B",
    peRatio: 12.8,
    dividend: "3.9%",
    range52: "£7.30 - £8.60",
    tags: ["UK Equities", "FTSE 100 Index", "Dividends"],
    ethical: { halal: false, esgScore: "AA", faithAligned: true },
    description: "Seeks to track the performance of the FTSE 100 index, containing the 100 largest UK-listed blue chip companies on the London Stock Exchange."
  }
];

// --- Mock Leaderboard for Mustard Cup Championship ---
const INITIAL_LEADERBOARD = [
  { rank: 1, name: "Cambridge FinTech Society", school: "University of Cambridge", returnPct: 24.8, value: 31200, badge: "🥇 Gold Trophy", trades: 42, streak: 14 },
  { rank: 2, name: "Manchester Alpha Fund", school: "Univ. of Manchester", returnPct: 21.4, value: 30350, badge: "🥈 Silver Trophy", trades: 38, streak: 12 },
  { rank: 3, name: "Imperial Quant Guild", school: "Imperial College London", returnPct: 19.6, value: 29900, badge: "🥉 Bronze Trophy", trades: 64, streak: 11 },
  { rank: 4, name: "Westminster Bulls", school: "Westminster School", returnPct: 17.2, value: 29300, badge: "💎 Diamond Trader", trades: 29, streak: 9 },
  { rank: 5, name: "Oxford St. John's", school: "University of Oxford", returnPct: 15.8, value: 28950, badge: "⚡ Top Performer", trades: 33, streak: 8 },
  { rank: 6, name: "Eton Economics Society", school: "Eton College", returnPct: 14.1, value: 28525, badge: "📈 FTSE Master", trades: 25, streak: 7 },
  { rank: 7, name: "Bristol Green Investors", school: "University of Bristol", returnPct: 12.9, value: 28225, badge: "🌱 ESG Champion", trades: 19, streak: 10 },
  { rank: 8, name: "Warwick Finance Society", school: "University of Warwick", returnPct: 11.5, value: 27875, badge: "🎯 Sharp Shooter", trades: 48, streak: 6 },
  { rank: 9, name: "Leeds High Tech Club", school: "Leeds Grammar", returnPct: 9.8, value: 27450, badge: "🚀 Tech Titan", trades: 22, streak: 5 },
  { rank: 10, name: "Edinburgh Horizons", school: "University of Edinburgh", returnPct: 8.2, value: 27050, badge: "🛡️ Diversified", trades: 18, streak: 4 }
];

// --- Audio Effects via Web Audio API ---
class SoundEffects {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  playChime() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }
}
const sfx = new SoundEffects();

// --- Portfolio State Management ---
class PortfolioStore {
  constructor() {
    this.STORAGE_KEY = 'mustard_investments_data_v1';
    this.GBP_USD_RATE = 1.28; // £1 = $1.28
    this.currency = 'GBP'; // 'GBP' or 'USD'
    this.assets = JSON.parse(JSON.stringify(INITIAL_ASSETS));
    this.loadState();
  }

  loadState() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.startingCash = parsed.startingCash || 25000;
        this.cash = parsed.cash !== undefined ? parsed.cash : 25000;
        this.holdings = parsed.holdings || [];
        this.transactions = parsed.transactions || [];
        this.watchlist = parsed.watchlist || ["RR.L", "SHEL.L", "AZN.L", "AAPL", "NVDA", "BTC-USD"];
        this.xp = parsed.xp || 1250;
        this.streak = parsed.streak || 7;
        this.currency = parsed.currency || 'GBP';
        this.portfolioHistory = parsed.portfolioHistory || this.generateInitialHistory();
        return;
      } catch (e) {
        console.error("Failed to load portfolio state:", e);
      }
    }

    // Default Initial State with initial simulated positions
    this.startingCash = 25000;
    this.cash = 14250.00;
    this.currency = 'GBP';
    this.watchlist = ["RR.L", "SHEL.L", "AZN.L", "AAPL", "NVDA", "BTC-USD"];
    this.xp = 1420;
    this.streak = 7;
    
    // Starter holdings for an active dashboard feel
    this.holdings = [
      {
        symbol: "RR.L",
        shares: 500,
        avgPrice: 4.80,
        dateAdded: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        symbol: "AZN.L",
        shares: 20,
        avgPrice: 114.50,
        dateAdded: new Date(Date.now() - 86400000 * 4).toISOString()
      },
      {
        symbol: "NVDA",
        shares: 15,
        avgPrice: 124.00,
        dateAdded: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        symbol: "BTC-USD",
        shares: 0.045,
        avgPrice: 66500.00,
        dateAdded: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];

    this.transactions = [
      {
        id: "tx-init-1",
        date: new Date(Date.now() - 86400000 * 5).toLocaleString('en-GB'),
        type: "BUY",
        symbol: "RR.L",
        name: "Rolls-Royce Holdings plc",
        shares: 500,
        price: 4.80,
        total: 2400.00,
        currency: "GBP"
      },
      {
        id: "tx-init-2",
        date: new Date(Date.now() - 86400000 * 4).toLocaleString('en-GB'),
        type: "BUY",
        symbol: "AZN.L",
        name: "AstraZeneca plc",
        shares: 20,
        price: 114.50,
        total: 2290.00,
        currency: "GBP"
      },
      {
        id: "tx-init-3",
        date: new Date(Date.now() - 86400000 * 2).toLocaleString('en-GB'),
        type: "BUY",
        symbol: "NVDA",
        name: "NVIDIA Corporation",
        shares: 15,
        price: 124.00,
        total: 1860.00,
        currency: "USD"
      },
      {
        id: "tx-init-4",
        date: new Date(Date.now() - 86400000 * 1).toLocaleString('en-GB'),
        type: "BUY",
        symbol: "BTC-USD",
        name: "Bitcoin",
        shares: 0.045,
        price: 66500.00,
        total: 2992.50,
        currency: "USD"
      }
    ];

    this.portfolioHistory = this.generateInitialHistory();
    this.saveState();
  }

  generateInitialHistory() {
    const points = [];
    const base = this.startingCash;
    let curr = base * 0.96;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      curr += (Math.random() - 0.44) * 280;
      points.push({
        date: d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        value: Math.max(base * 0.85, Math.round(curr * 100) / 100)
      });
    }
    return points;
  }

  saveState() {
    try {
      const data = {
        startingCash: this.startingCash,
        cash: this.cash,
        holdings: this.holdings,
        transactions: this.transactions,
        watchlist: this.watchlist,
        xp: this.xp,
        streak: this.streak,
        currency: this.currency,
        portfolioHistory: this.portfolioHistory
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Storage quota exceeded or unavailable:", e);
    }
  }

  getAsset(symbol) {
    return this.assets.find(a => a.symbol === symbol);
  }

  // Value of an asset in portfolio base currency (GBP)
  getAssetPriceInGBP(asset) {
    if (!asset) return 0;
    if (asset.currency === 'USD') {
      return asset.price / this.GBP_USD_RATE;
    }
    return asset.price;
  }

  // Format currency based on active user setting (£ or $)
  formatMoney(amountInGBP, forceCurrency = null) {
    const cur = forceCurrency || this.currency;
    if (cur === 'USD') {
      const val = amountInGBP * this.GBP_USD_RATE;
      return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '£' + amountInGBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Total current market value of all investments
  getInvestedValue() {
    let total = 0;
    for (const h of this.holdings) {
      const asset = this.getAsset(h.symbol);
      if (asset) {
        const priceGBP = this.getAssetPriceInGBP(asset);
        total += h.shares * priceGBP;
      }
    }
    return total;
  }

  // Total Portfolio Net Worth (Investments + Cash)
  getTotalValue() {
    return this.cash + this.getInvestedValue();
  }

  // Total Profit/Loss against initial starting cash
  getTotalReturn() {
    const total = this.getTotalValue();
    const diff = total - this.startingCash;
    const pct = this.startingCash > 0 ? (diff / this.startingCash) * 100 : 0;
    return { diff, pct };
  }

  // Today's estimated gain based on asset 24h movements
  getDailyGain() {
    let dayGainGBP = 0;
    for (const h of this.holdings) {
      const asset = this.getAsset(h.symbol);
      if (asset) {
        const priceGBP = this.getAssetPriceInGBP(asset);
        const dayChangeGBP = priceGBP * (asset.changePercent / 100);
        dayGainGBP += h.shares * dayChangeGBP;
      }
    }
    const totalVal = this.getTotalValue();
    const dayGainPct = totalVal > 0 ? (dayGainGBP / totalVal) * 100 : 0;
    return { diff: dayGainGBP, pct: dayGainPct };
  }

  // Execute a BUY order
  buy(symbol, quantityOrAmount, isByAmount = false) {
    const asset = this.getAsset(symbol);
    if (!asset) return { success: false, message: "Asset not found" };

    const priceGBP = this.getAssetPriceInGBP(asset);
    let shares = 0;
    let costGBP = 0;

    if (isByAmount) {
      costGBP = parseFloat(quantityOrAmount);
      if (isNaN(costGBP) || costGBP <= 0) return { success: false, message: "Enter a valid amount" };
      shares = costGBP / priceGBP;
    } else {
      shares = parseFloat(quantityOrAmount);
      if (isNaN(shares) || shares <= 0) return { success: false, message: "Enter a valid number of shares" };
      costGBP = shares * priceGBP;
    }

    if (costGBP > this.cash) {
      return { 
        success: false, 
        message: `Insufficient funds. Needed ${this.formatMoney(costGBP)}, available ${this.formatMoney(this.cash)}.` 
      };
    }

    // Deduct cash
    this.cash -= costGBP;

    // Update or add holding
    const existing = this.holdings.find(h => h.symbol === symbol);
    if (existing) {
      const totalShares = existing.shares + shares;
      const totalCost = (existing.shares * existing.avgPrice) + (shares * asset.price);
      existing.avgPrice = totalCost / totalShares;
      existing.shares = totalShares;
    } else {
      this.holdings.push({
        symbol: symbol,
        shares: shares,
        avgPrice: asset.price,
        dateAdded: new Date().toISOString()
      });
    }

    // Record Transaction
    this.transactions.unshift({
      id: "tx-" + Date.now(),
      date: new Date().toLocaleString('en-GB'),
      type: "BUY",
      symbol: symbol,
      name: asset.name,
      shares: Number(shares.toFixed(4)),
      price: asset.price,
      total: Number(costGBP.toFixed(2)),
      currency: asset.currency
    });

    // Gamification rewards
    this.xp += 50;

    this.saveState();
    sfx.playChime();
    return { 
      success: true, 
      message: `Successfully bought ${shares.toFixed(3)} shares of ${symbol} for ${this.formatMoney(costGBP)}!` 
    };
  }

  // Execute a SELL order
  sell(symbol, sharesToSell) {
    const asset = this.getAsset(symbol);
    if (!asset) return { success: false, message: "Asset not found" };

    const existingIndex = this.holdings.findIndex(h => h.symbol === symbol);
    if (existingIndex === -1) return { success: false, message: "You don't own any shares of this asset" };

    const holding = this.holdings[existingIndex];
    const shares = parseFloat(sharesToSell);

    if (isNaN(shares) || shares <= 0) return { success: false, message: "Enter a valid share quantity" };
    if (shares > holding.shares + 0.00001) {
      return { success: false, message: `Cannot sell ${shares} shares. You only own ${holding.shares.toFixed(4)} shares.` };
    }

    const priceGBP = this.getAssetPriceInGBP(asset);
    const saleProceedsGBP = shares * priceGBP;

    // Credit cash
    this.cash += saleProceedsGBP;

    // Calculate Realized P/L
    const avgCostBasisGBP = holding.avgPrice * (asset.currency === 'USD' ? (1 / this.GBP_USD_RATE) : 1);
    const realizedPL_GBP = (priceGBP - avgCostBasisGBP) * shares;

    // Adjust or remove holding
    if (Math.abs(holding.shares - shares) < 0.0001) {
      this.holdings.splice(existingIndex, 1);
    } else {
      holding.shares -= shares;
    }

    // Record Transaction
    this.transactions.unshift({
      id: "tx-" + Date.now(),
      date: new Date().toLocaleString('en-GB'),
      type: "SELL",
      symbol: symbol,
      name: asset.name,
      shares: Number(shares.toFixed(4)),
      price: asset.price,
      total: Number(saleProceedsGBP.toFixed(2)),
      realizedPL: Number(realizedPL_GBP.toFixed(2)),
      currency: asset.currency
    });

    this.xp += 60;
    this.saveState();
    sfx.playChime();

    return { 
      success: true, 
      message: `Sold ${shares.toFixed(3)} shares of ${symbol} for ${this.formatMoney(saleProceedsGBP)}!` 
    };
  }

  toggleWatchlist(symbol) {
    const idx = this.watchlist.indexOf(symbol);
    if (idx === -1) {
      this.watchlist.push(symbol);
      this.saveState();
      return true;
    } else {
      this.watchlist.splice(idx, 1);
      this.saveState();
      return false;
    }
  }

  resetPortfolio(newBalance = 25000) {
    this.startingCash = newBalance;
    this.cash = newBalance;
    this.holdings = [];
    this.transactions = [];
    this.portfolioHistory = this.generateInitialHistory();
    this.saveState();
  }
}

// Global App Instance
const app = new PortfolioStore();

// --- Live Market Simulation Engine ---
function startPriceSimulation() {
  setInterval(() => {
    // Pick 2-4 random assets to tick
    const count = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * app.assets.length);
      const asset = app.assets[idx];
      
      // Volatility factor based on category
      const vol = asset.category === 'Crypto' ? 0.012 : 0.0035;
      const pctDelta = (Math.random() - 0.49) * vol;
      const oldPrice = asset.price;
      const newPrice = Math.max(0.01, oldPrice * (1 + pctDelta));
      
      asset.price = Number(newPrice.toFixed(asset.price < 5 ? 4 : 2));
      asset.change = Number((asset.change + (asset.price - oldPrice)).toFixed(2));
      asset.changePercent = Number((asset.changePercent + (pctDelta * 100)).toFixed(2));

      // Trigger flash element in DOM if visible
      const el = document.getElementById(`price-${asset.symbol}`);
      if (el) {
        el.textContent = formatAssetPrice(asset);
        el.classList.remove('tick-up', 'tick-down');
        void el.offsetWidth; // reflow
        el.classList.add(pctDelta >= 0 ? 'tick-up' : 'tick-down');
      }
    }

    // Refresh active views smoothly
    renderTopMetrics();
  }, 3500);
}

function formatAssetPrice(asset) {
  if (asset.currency === 'USD') {
    return '$' + asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '£' + asset.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Navigation & View Switching ---
function showView(viewId) {
  document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-tab').forEach(t => {
    if (t.dataset.view === viewId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  // Render view-specific data
  if (viewId === 'dashboard') renderDashboard();
  if (viewId === 'holdings') renderHoldings();
  if (viewId === 'markets') renderMarkets();
  if (viewId === 'trade') renderTradeTerminal();
  if (viewId === 'leaderboard') renderLeaderboard();
  if (viewId === 'history') renderHistory();
  if (viewId === 'badges') renderBadges();

  sfx.playClick();
}

// --- View Renderers ---
let netWorthChart = null;

function renderTopMetrics() {
  const totalVal = app.getTotalValue();
  const dayGain = app.getDailyGain();
  const totalReturn = app.getTotalReturn();

  // Header quick pills
  const totalEl = document.getElementById('metric-total-value');
  const cashEl = document.getElementById('metric-cash-value');
  const dayGainEl = document.getElementById('metric-day-gain');
  const totalReturnEl = document.getElementById('metric-total-return');
  const xpEl = document.getElementById('header-xp');
  const streakEl = document.getElementById('header-streak');

  if (totalEl) totalEl.textContent = app.formatMoney(totalVal);
  if (cashEl) cashEl.textContent = app.formatMoney(app.cash);
  if (xpEl) xpEl.textContent = `${app.xp} XP`;
  if (streakEl) streakEl.textContent = `🔥 ${app.streak} Day Streak`;

  if (dayGainEl) {
    const isPos = dayGain.diff >= 0;
    dayGainEl.className = isPos ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold';
    dayGainEl.textContent = `${isPos ? '+' : ''}${app.formatMoney(dayGain.diff)} (${isPos ? '+' : ''}${dayGain.pct.toFixed(2)}%)`;
  }

  if (totalReturnEl) {
    const isPos = totalReturn.diff >= 0;
    totalReturnEl.className = isPos ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold';
    totalReturnEl.textContent = `${isPos ? '+' : ''}${app.formatMoney(totalReturn.diff)} (${isPos ? '+' : ''}${totalReturn.pct.toFixed(2)}%)`;
  }
}

function renderDashboard() {
  renderTopMetrics();
  initNetWorthChart();
  renderWatchlistCarousel();
  renderDashboardHoldingsPreview();
  renderAssetAllocation();
}

function initNetWorthChart() {
  const ctx = document.getElementById('netWorthChart');
  if (!ctx) return;

  const labels = app.portfolioHistory.map(p => p.date);
  const data = app.portfolioHistory.map(p => p.value);

  // Update current point to live total value
  data[data.length - 1] = Math.round(app.getTotalValue() * 100) / 100;

  if (netWorthChart) {
    netWorthChart.data.labels = labels;
    netWorthChart.data.datasets[0].data = data;
    netWorthChart.update('none');
    return;
  }

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
  gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

  netWorthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Net Worth',
        data: data,
        borderColor: '#F59E0B',
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#FBBF24',
        pointHoverBorderColor: '#0F172A',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          borderColor: '#F59E0B',
          borderWidth: 1,
          titleColor: '#94A3B8',
          bodyColor: '#F8FAFC',
          bodyFont: { weight: 'bold' },
          callbacks: {
            label: (ctx) => ` Portfolio: ${app.formatMoney(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', maxTicksLimit: 7 }
        },
        y: {
          grid: { color: '#1E293B' },
          ticks: {
            color: '#64748B',
            callback: (v) => app.formatMoney(v)
          }
        }
      }
    }
  });
}

function renderWatchlistCarousel() {
  const container = document.getElementById('watchlist-carousel');
  if (!container) return;

  if (app.watchlist.length === 0) {
    container.innerHTML = `<div class="text-slate-500 text-sm py-4">Your watchlist is empty. Click the ⭐ star icon in Markets to pin assets here!</div>`;
    return;
  }

  let html = '';
  for (const sym of app.watchlist) {
    const asset = app.getAsset(sym);
    if (!asset) continue;

    const isPos = asset.changePercent >= 0;
    html += `
      <div onclick="openTradeModal('${asset.symbol}')" class="cursor-pointer bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 flex-1 min-w-[160px] transition">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-bold text-amber-400 text-sm tracking-wide">${asset.symbol}</span>
          <span class="text-xs px-2 py-0.5 rounded ${isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} font-medium">
            ${isPos ? '+' : ''}${asset.changePercent.toFixed(2)}%
          </span>
        </div>
        <div class="text-xs text-slate-400 truncate mb-1">${asset.name}</div>
        <div class="text-base font-extrabold text-slate-100" id="price-${asset.symbol}">
          ${formatAssetPrice(asset)}
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function renderDashboardHoldingsPreview() {
  const container = document.getElementById('dashboard-holdings-preview');
  if (!container) return;

  if (app.holdings.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-slate-500 text-sm">
          No open positions. Head over to <b>Markets</b> or <b>Quick Trade</b> to invest your cash!
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  for (const h of app.holdings.slice(0, 5)) {
    const asset = app.getAsset(h.symbol);
    if (!asset) continue;

    const priceGBP = app.getAssetPriceInGBP(asset);
    const mktVal = h.shares * priceGBP;
    const costBasisGBP = h.avgPrice * (asset.currency === 'USD' ? (1 / app.GBP_USD_RATE) : 1) * h.shares;
    const gainGBP = mktVal - costBasisGBP;
    const gainPct = costBasisGBP > 0 ? (gainGBP / costBasisGBP) * 100 : 0;
    const isPos = gainGBP >= 0;

    html += `
      <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 cursor-pointer" onclick="openTradeModal('${asset.symbol}')">
        <td class="py-3 px-4">
          <div class="font-bold text-slate-100 flex items-center gap-2">
            <span>${asset.symbol}</span>
            ${asset.ethical.halal ? '<span class="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.2 rounded">Halal</span>' : ''}
          </div>
          <div class="text-xs text-slate-400 truncate max-w-[150px]">${asset.name}</div>
        </td>
        <td class="py-3 px-4 text-right text-slate-200 font-medium">${h.shares.toLocaleString()}</td>
        <td class="py-3 px-4 text-right text-slate-300">${formatAssetPrice(asset)}</td>
        <td class="py-3 px-4 text-right font-bold text-slate-100">${app.formatMoney(mktVal)}</td>
        <td class="py-3 px-4 text-right font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}">
          ${isPos ? '+' : ''}${app.formatMoney(gainGBP)} (${isPos ? '+' : ''}${gainPct.toFixed(2)}%)
        </td>
      </tr>
    `;
  }
  container.innerHTML = html;
}

function renderAssetAllocation() {
  const container = document.getElementById('allocation-bars');
  if (!container) return;

  const total = app.getTotalValue();
  let stocks = 0, crypto = 0, etfs = 0;

  for (const h of app.holdings) {
    const asset = app.getAsset(h.symbol);
    if (!asset) continue;
    const val = h.shares * app.getAssetPriceInGBP(asset);
    if (asset.category === 'Crypto') crypto += val;
    else if (asset.category === 'ETFs & Indices') etfs += val;
    else stocks += val;
  }

  const cash = app.cash;
  const sPct = total > 0 ? (stocks / total) * 100 : 0;
  const cPct = total > 0 ? (crypto / total) * 100 : 0;
  const ePct = total > 0 ? (etfs / total) * 100 : 0;
  const cashPct = total > 0 ? (cash / total) * 100 : 0;

  container.innerHTML = `
    <div class="flex h-3 w-full rounded-full overflow-hidden bg-slate-800 mb-3">
      <div style="width: ${sPct}%" class="bg-amber-500" title="Equities: ${sPct.toFixed(1)}%"></div>
      <div style="width: ${cPct}%" class="bg-indigo-500" title="Crypto: ${cPct.toFixed(1)}%"></div>
      <div style="width: ${ePct}%" class="bg-emerald-500" title="ETFs: ${ePct.toFixed(1)}%"></div>
      <div style="width: ${cashPct}%" class="bg-slate-500" title="Cash: ${cashPct.toFixed(1)}%"></div>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
      <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Stocks (${sPct.toFixed(1)}%)</div>
      <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> Crypto (${cPct.toFixed(1)}%)</div>
      <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> ETFs (${ePct.toFixed(1)}%)</div>
      <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span> Cash (${cashPct.toFixed(1)}%)</div>
    </div>
  `;
}

// --- Holdings View ---
function renderHoldings() {
  const container = document.getElementById('holdings-table-body');
  if (!container) return;

  if (app.holdings.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-12 text-slate-400">
          <div class="text-4xl mb-3">💼</div>
          <div class="text-base font-bold text-slate-200">No Open Positions</div>
          <div class="text-sm text-slate-500 mt-1">Start building your simulated investment portfolio now.</div>
          <button onclick="showView('markets')" class="mt-4 mustard-btn-primary px-4 py-2 rounded-lg text-sm">Browse Markets</button>
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  for (const h of app.holdings) {
    const asset = app.getAsset(h.symbol);
    if (!asset) continue;

    const priceGBP = app.getAssetPriceInGBP(asset);
    const mktVal = h.shares * priceGBP;
    const costBasisGBP = h.avgPrice * (asset.currency === 'USD' ? (1 / app.GBP_USD_RATE) : 1) * h.shares;
    const gainGBP = mktVal - costBasisGBP;
    const gainPct = costBasisGBP > 0 ? (gainGBP / costBasisGBP) * 100 : 0;
    const isPos = gainGBP >= 0;

    html += `
      <tr class="border-b border-slate-800 hover:bg-slate-800/30">
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-amber-400 text-sm">${asset.symbol}</span>
            ${asset.ethical.halal ? '<span class="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded">Halal</span>' : ''}
            ${asset.ethical.faithAligned ? '<span class="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded">Faith</span>' : ''}
          </div>
          <div class="text-xs text-slate-400 truncate max-w-[200px]">${asset.name}</div>
        </td>
        <td class="py-3 px-4 text-slate-300 text-xs">${asset.category}</td>
        <td class="py-3 px-4 text-right font-medium text-slate-200">${h.shares.toLocaleString()}</td>
        <td class="py-3 px-4 text-right text-slate-300">${formatAssetPrice(asset)}</td>
        <td class="py-3 px-4 text-right font-bold text-slate-100">${app.formatMoney(mktVal)}</td>
        <td class="py-3 px-4 text-right font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}">
          ${isPos ? '+' : ''}${app.formatMoney(gainGBP)}<br>
          <span class="text-xs font-normal">(${isPos ? '+' : ''}${gainPct.toFixed(2)}%)</span>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openTradeModal('${asset.symbol}', 'BUY')" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold px-2.5 py-1.5 rounded transition">
              + Buy
            </button>
            <button onclick="openTradeModal('${asset.symbol}', 'SELL')" class="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold px-2.5 py-1.5 rounded transition">
              Sell
            </button>
          </div>
        </td>
      </tr>
    `;
  }
  container.innerHTML = html;
}

// --- Markets Screener View ---
let marketFilter = 'ALL';
let marketSearchQuery = '';

function setMarketFilter(filter) {
  marketFilter = filter;
  document.querySelectorAll('.market-filter-pill').forEach(btn => {
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderMarkets();
}

function renderMarkets() {
  const container = document.getElementById('markets-grid');
  if (!container) return;

  const query = marketSearchQuery.trim().toLowerCase();
  const filtered = app.assets.filter(asset => {
    // Search match
    const matchSearch = !query || asset.symbol.toLowerCase().includes(query) || asset.name.toLowerCase().includes(query) || asset.tags.some(t => t.toLowerCase().includes(query));
    if (!matchSearch) return false;

    // Filter match
    if (marketFilter === 'FTSE') return asset.category === 'FTSE 100';
    if (marketFilter === 'US') return asset.category === 'US Tech';
    if (marketFilter === 'CRYPTO') return asset.category === 'Crypto';
    if (marketFilter === 'ETF') return asset.category === 'ETFs & Indices';
    if (marketFilter === 'HALAL') return asset.ethical.halal;
    if (marketFilter === 'GAINERS') return asset.changePercent > 0;
    if (marketFilter === 'LOSERS') return asset.changePercent < 0;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-500">
        No assets match your search or filter criteria.
      </div>
    `;
    return;
  }

  let html = '';
  for (const asset of filtered) {
    const isStarred = app.watchlist.includes(asset.symbol);
    const isPos = asset.changePercent >= 0;

    html += `
      <div class="mustard-card p-4 flex flex-col justify-between hover:border-amber-500/50 transition relative">
        <button onclick="event.stopPropagation(); toggleStar('${asset.symbol}')" class="absolute top-3.5 right-3.5 text-lg ${isStarred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}" title="Toggle Watchlist">
          ★
        </button>

        <div onclick="openTradeModal('${asset.symbol}')" class="cursor-pointer">
          <div class="flex items-start gap-2 mb-2">
            <div>
              <span class="font-extrabold text-amber-400 text-base tracking-wide">${asset.symbol}</span>
              <div class="text-xs text-slate-400 truncate max-w-[190px] font-medium">${asset.name}</div>
            </div>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap my-2.5">
            <span class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">${asset.category}</span>
            ${asset.ethical.halal ? '<span class="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded">Halal</span>' : ''}
            ${asset.ethical.esgScore ? `<span class="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded">ESG: ${asset.ethical.esgScore}</span>` : ''}
          </div>

          <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-end justify-between">
            <div>
              <div class="text-[11px] text-slate-500">Market Price</div>
              <div class="text-lg font-extrabold text-slate-100" id="price-${asset.symbol}">
                ${formatAssetPrice(asset)}
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs px-2 py-1 rounded font-bold ${isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
                ${isPos ? '+' : ''}${asset.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div class="mt-3.5 pt-2 flex gap-2">
          <button onclick="openTradeModal('${asset.symbol}', 'BUY')" class="flex-1 mustard-btn-primary text-xs py-2 rounded-lg font-bold">
            Trade
          </button>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function toggleStar(symbol) {
  app.toggleWatchlist(symbol);
  renderMarkets();
  renderWatchlistCarousel();
}

// --- Quick Trade Terminal View ---
function renderTradeTerminal() {
  const select = document.getElementById('trade-terminal-asset-select');
  if (!select) return;

  select.innerHTML = app.assets.map(a => `
    <option value="${a.symbol}">${a.symbol} - ${a.name} (${formatAssetPrice(a)})</option>
  `).join('');

  updateTradeTerminalPreview();
}

function updateTradeTerminalPreview() {
  const symbol = document.getElementById('trade-terminal-asset-select')?.value;
  const side = document.querySelector('input[name="trade-side"]:checked')?.value || 'BUY';
  const mode = document.querySelector('input[name="trade-mode"]:checked')?.value || 'AMOUNT';
  const inputVal = parseFloat(document.getElementById('trade-terminal-amount')?.value) || 0;

  const asset = app.getAsset(symbol);
  if (!asset) return;

  const priceGBP = app.getAssetPriceInGBP(asset);
  let estShares = 0;
  let totalGBP = 0;

  if (mode === 'AMOUNT') {
    totalGBP = inputVal;
    estShares = priceGBP > 0 ? totalGBP / priceGBP : 0;
  } else {
    estShares = inputVal;
    totalGBP = estShares * priceGBP;
  }

  const estSharesEl = document.getElementById('trade-calc-shares');
  const estCostEl = document.getElementById('trade-calc-cost');
  const availCashEl = document.getElementById('trade-calc-available');

  if (estSharesEl) estSharesEl.textContent = `${estShares.toFixed(4)} ${asset.symbol}`;
  if (estCostEl) estCostEl.textContent = app.formatMoney(totalGBP);
  if (availCashEl) availCashEl.textContent = app.formatMoney(app.cash);
}

function executeTerminalTrade() {
  const symbol = document.getElementById('trade-terminal-asset-select')?.value;
  const side = document.querySelector('input[name="trade-side"]:checked')?.value || 'BUY';
  const mode = document.querySelector('input[name="trade-mode"]:checked')?.value || 'AMOUNT';
  const inputVal = parseFloat(document.getElementById('trade-terminal-amount')?.value) || 0;

  let res;
  if (side === 'BUY') {
    res = app.buy(symbol, inputVal, mode === 'AMOUNT');
  } else {
    // If selling by amount, calculate shares
    const asset = app.getAsset(symbol);
    const priceGBP = app.getAssetPriceInGBP(asset);
    const sharesToSell = mode === 'AMOUNT' ? (inputVal / priceGBP) : inputVal;
    res = app.sell(symbol, sharesToSell);
  }

  showToast(res.message, res.success ? 'success' : 'error');
  renderTopMetrics();
  updateTradeTerminalPreview();
}

// --- Trade Modal (Global popup accessible from anywhere) ---
let currentModalAsset = null;
let currentModalSide = 'BUY';
let modalChart = null;

function openTradeModal(symbol, side = 'BUY') {
  currentModalAsset = app.getAsset(symbol);
  if (!currentModalAsset) return;
  currentModalSide = side;

  document.getElementById('modal-asset-symbol').textContent = currentModalAsset.symbol;
  document.getElementById('modal-asset-name').textContent = currentModalAsset.name;
  document.getElementById('modal-asset-price').textContent = formatAssetPrice(currentModalAsset);
  document.getElementById('modal-asset-desc').textContent = currentModalAsset.description;

  // Ethical tags
  const tagsEl = document.getElementById('modal-asset-tags');
  tagsEl.innerHTML = `
    <span class="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">${currentModalAsset.category}</span>
    ${currentModalAsset.ethical.halal ? '<span class="text-xs bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded">✓ Halal Compliant</span>' : ''}
    ${currentModalAsset.ethical.faithAligned ? '<span class="text-xs bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">✓ Faith-Aligned</span>' : ''}
    <span class="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">ESG Score: ${currentModalAsset.ethical.esgScore}</span>
  `;

  // Set side
  setModalTradeSide(side);
  document.getElementById('modal-trade-input').value = '';
  updateModalCalc();
  initModalChart();

  document.getElementById('trade-modal').classList.remove('hidden');
}

function closeTradeModal() {
  document.getElementById('trade-modal').classList.add('hidden');
}

function setModalTradeSide(side) {
  currentModalSide = side;
  const buyBtn = document.getElementById('modal-btn-side-buy');
  const sellBtn = document.getElementById('modal-btn-side-sell');
  const submitBtn = document.getElementById('modal-submit-btn');

  if (side === 'BUY') {
    buyBtn.className = 'flex-1 py-2 rounded-lg font-bold text-sm bg-amber-500 text-slate-900 shadow';
    sellBtn.className = 'flex-1 py-2 rounded-lg font-bold text-sm bg-slate-800 text-slate-400 hover:text-slate-200';
    submitBtn.textContent = `Confirm Buy ${currentModalAsset.symbol}`;
    submitBtn.className = 'w-full mustard-btn-primary py-3 rounded-xl font-extrabold text-slate-950 transition';
  } else {
    buyBtn.className = 'flex-1 py-2 rounded-lg font-bold text-sm bg-slate-800 text-slate-400 hover:text-slate-200';
    sellBtn.className = 'flex-1 py-2 rounded-lg font-bold text-sm bg-rose-500 text-white shadow';
    submitBtn.textContent = `Confirm Sell ${currentModalAsset.symbol}`;
    submitBtn.className = 'w-full bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-extrabold text-white transition';
  }
  updateModalCalc();
}

function updateModalCalc() {
  if (!currentModalAsset) return;

  const mode = document.querySelector('input[name="modal-mode"]:checked')?.value || 'AMOUNT';
  const inputVal = parseFloat(document.getElementById('modal-trade-input')?.value) || 0;
  const priceGBP = app.getAssetPriceInGBP(currentModalAsset);

  let shares = 0;
  let totalGBP = 0;

  if (mode === 'AMOUNT') {
    totalGBP = inputVal;
    shares = priceGBP > 0 ? totalGBP / priceGBP : 0;
  } else {
    shares = inputVal;
    totalGBP = shares * priceGBP;
  }

  document.getElementById('modal-calc-shares').textContent = `${shares.toFixed(4)} ${currentModalAsset.symbol}`;
  document.getElementById('modal-calc-cost').textContent = app.formatMoney(totalGBP);
  document.getElementById('modal-calc-avail').textContent = app.formatMoney(app.cash);

  // Check owned shares
  const owned = app.holdings.find(h => h.symbol === currentModalAsset.symbol);
  document.getElementById('modal-calc-owned').textContent = owned ? `${owned.shares.toFixed(4)} shares` : '0 shares';
}

function submitModalTrade() {
  if (!currentModalAsset) return;

  const mode = document.querySelector('input[name="modal-mode"]:checked')?.value || 'AMOUNT';
  const inputVal = parseFloat(document.getElementById('modal-trade-input')?.value) || 0;

  let res;
  if (currentModalSide === 'BUY') {
    res = app.buy(currentModalAsset.symbol, inputVal, mode === 'AMOUNT');
  } else {
    const priceGBP = app.getAssetPriceInGBP(currentModalAsset);
    const sharesToSell = mode === 'AMOUNT' ? (inputVal / priceGBP) : inputVal;
    res = app.sell(currentModalAsset.symbol, sharesToSell);
  }

  showToast(res.message, res.success ? 'success' : 'error');
  if (res.success) {
    closeTradeModal();
    renderTopMetrics();
    renderDashboard();
    renderHoldings();
  }
}

function initModalChart() {
  const ctx = document.getElementById('modalAssetChart');
  if (!ctx || !currentModalAsset) return;

  // Generate 20 pseudo historical points
  const labels = [];
  const data = [];
  let p = currentModalAsset.price * 0.94;
  for (let i = 19; i >= 0; i--) {
    labels.push(`${20 - i}d`);
    p += (Math.random() - 0.48) * (currentModalAsset.price * 0.025);
    data.push(Number(p.toFixed(2)));
  }
  data[data.length - 1] = currentModalAsset.price;

  if (modalChart) {
    modalChart.destroy();
  }

  modalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: currentModalAsset.symbol,
        data: data,
        borderColor: '#F59E0B',
        borderWidth: 2,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { grid: { color: '#1E293B' }, ticks: { color: '#64748B' } }
      }
    }
  });
}

// --- Leaderboard View (Mustard Cup Championship) ---
function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;

  const totalReturn = app.getTotalReturn();
  const userScore = {
    rank: 0,
    name: "You (Mustard Trader)",
    school: "Independent Portfolio",
    returnPct: Number(totalReturn.pct.toFixed(2)),
    value: Number(app.getTotalValue().toFixed(2)),
    badge: "🚀 Active Trader",
    trades: app.transactions.length,
    streak: app.streak,
    isUser: true
  };

  // Merge & sort
  const board = JSON.parse(JSON.stringify(INITIAL_LEADERBOARD));
  board.push(userScore);
  board.sort((a, b) => b.returnPct - a.returnPct);

  // Assign ranks
  board.forEach((item, idx) => item.rank = idx + 1);

  let html = '';
  for (const item of board) {
    const isUser = item.isUser;
    html += `
      <div class="flex items-center justify-between p-4 rounded-xl border ${isUser ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5' : 'bg-slate-900/60 border-slate-800'} transition">
        <div class="flex items-center gap-3.5">
          <div class="w-8 text-center font-extrabold ${item.rank === 1 ? 'text-amber-400 text-lg' : item.rank === 2 ? 'text-slate-300 text-lg' : item.rank === 3 ? 'text-amber-600 text-lg' : 'text-slate-500'}">
            #${item.rank}
          </div>
          <div>
            <div class="font-bold ${isUser ? 'text-amber-400' : 'text-slate-100'} flex items-center gap-2">
              <span>${item.name}</span>
              ${isUser ? '<span class="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">YOU</span>' : ''}
            </div>
            <div class="text-xs text-slate-400">${item.school} • ${item.trades} trades • 🔥 ${item.streak}d</div>
          </div>
        </div>

        <div class="text-right">
          <div class="font-extrabold text-base ${item.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
            ${item.returnPct >= 0 ? '+' : ''}${item.returnPct}%
          </div>
          <div class="text-xs text-slate-400">${app.formatMoney(item.value)}</div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// --- Transaction History View ---
function renderHistory() {
  const container = document.getElementById('history-table-body');
  if (!container) return;

  if (app.transactions.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-slate-500">No transaction records found.</td>
      </tr>
    `;
    return;
  }

  let html = '';
  for (const tx of app.transactions) {
    const isBuy = tx.type === 'BUY';
    html += `
      <tr class="border-b border-slate-800/80 hover:bg-slate-800/30">
        <td class="py-3 px-4 text-xs text-slate-400">${tx.date}</td>
        <td class="py-3 px-4">
          <span class="text-xs font-bold px-2 py-0.5 rounded ${isBuy ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}">
            ${tx.type}
          </span>
        </td>
        <td class="py-3 px-4 font-bold text-slate-200">${tx.symbol}</td>
        <td class="py-3 px-4 text-right text-slate-300">${tx.shares.toLocaleString()}</td>
        <td class="py-3 px-4 text-right text-slate-300">
          ${tx.currency === 'USD' ? '$' : '£'}${tx.price.toLocaleString()}
        </td>
        <td class="py-3 px-4 text-right font-extrabold text-slate-100">${app.formatMoney(tx.total)}</td>
      </tr>
    `;
  }
  container.innerHTML = html;
}

// --- Badges & Quests View ---
function renderBadges() {
  const container = document.getElementById('badges-grid');
  if (!container) return;

  const totalTrades = app.transactions.length;
  const holdingsCount = app.holdings.length;
  const hasHalal = app.holdings.some(h => app.getAsset(h.symbol)?.ethical.halal);
  const totalReturn = app.getTotalReturn();

  const BADGES = [
    { title: "First Seed Planted", desc: "Execute your very first trade in the simulator.", icon: "🌱", unlocked: totalTrades >= 1 },
    { title: "Active Trader", desc: "Execute 5 or more total buy/sell orders.", icon: "⚡", unlocked: totalTrades >= 5 },
    { title: "FTSE 100 Explorer", desc: "Invest in 2 or more UK London Stock Exchange equities.", icon: "🇬🇧", unlocked: app.holdings.filter(h => h.symbol.endsWith('.L')).length >= 2 },
    { title: "Silicon Valley Bull", desc: "Hold shares in top US Tech giants (Apple, Nvidia, etc.).", icon: "🇺🇸", unlocked: app.holdings.some(h => ['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(h.symbol)) },
    { title: "Crypto Pioneer", desc: "Diversify into digital assets with Bitcoin or Ethereum.", icon: "🪙", unlocked: app.holdings.some(h => h.symbol.includes('BTC') || h.symbol.includes('ETH')) },
    { title: "Faith & Ethical Investor", desc: "Hold at least one Halal / Faith-aligned certified asset.", icon: "🌱", unlocked: hasHalal },
    { title: "Diamond Hands", desc: "Achieve a total portfolio return greater than +5%.", icon: "💎", unlocked: totalReturn.pct >= 5 },
    { title: "Master of Diversification", desc: "Hold 4 or more distinct asset positions simultaneously.", icon: "🛡️", unlocked: holdingsCount >= 4 }
  ];

  let html = '';
  for (const b of BADGES) {
    html += `
      <div class="mustard-card p-4 flex items-center gap-4 ${b.unlocked ? 'border-amber-500/40' : 'opacity-60'}">
        <div class="text-3xl p-3 rounded-xl ${b.unlocked ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}">
          ${b.icon}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-100">${b.title}</span>
            ${b.unlocked ? '<span class="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">UNLOCKED</span>' : '<span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">LOCKED</span>'}
          </div>
          <div class="text-xs text-slate-400 mt-1">${b.desc}</div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// --- Toast Alerts ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const borderCol = type === 'success' ? 'border-emerald-500' : type === 'error' ? 'border-rose-500' : 'border-amber-500';
  toast.className = `toast-notice bg-slate-900 border ${borderCol} text-slate-100 text-sm p-4 rounded-xl shadow-2xl flex items-center gap-3`;
  toast.innerHTML = `
    <span class="text-lg">${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// --- Portfolio Reset & Backup Modals ---
function openResetModal() {
  document.getElementById('reset-modal').classList.remove('hidden');
}
function closeResetModal() {
  document.getElementById('reset-modal').classList.add('hidden');
}
function confirmResetPortfolio(balance) {
  app.resetPortfolio(balance);
  closeResetModal();
  showToast(`Portfolio reset with ${app.formatMoney(balance)} starting cash!`, 'success');
  renderTopMetrics();
  renderDashboard();
}

function openBackupModal() {
  const jsonStr = localStorage.getItem(app.STORAGE_KEY) || JSON.stringify(app);
  document.getElementById('backup-json-textarea').value = jsonStr;
  document.getElementById('backup-modal').classList.remove('hidden');
}
function closeBackupModal() {
  document.getElementById('backup-modal').classList.add('hidden');
}
function importBackupData() {
  try {
    const raw = document.getElementById('backup-json-textarea').value;
    const parsed = JSON.parse(raw);
    localStorage.setItem(app.STORAGE_KEY, JSON.stringify(parsed));
    app.loadState();
    closeBackupModal();
    showToast("Portfolio backup successfully imported!", "success");
    renderTopMetrics();
    renderDashboard();
  } catch (e) {
    showToast("Invalid JSON backup data", "error");
  }
}
function copyBackupToClipboard() {
  const raw = document.getElementById('backup-json-textarea').value;
  navigator.clipboard.writeText(raw);
  showToast("Backup JSON copied to clipboard!", "success");
}

function toggleCurrency() {
  app.currency = app.currency === 'GBP' ? 'USD' : 'GBP';
  document.getElementById('currency-btn-label').textContent = app.currency === 'GBP' ? '£ GBP' : '$ USD';
  app.saveState();
  renderTopMetrics();
  renderDashboard();
  if (!document.getElementById('view-holdings').classList.contains('hidden')) renderHoldings();
  if (!document.getElementById('view-markets').classList.contains('hidden')) renderMarkets();
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Setup Currency Button
  const curLabel = document.getElementById('currency-btn-label');
  if (curLabel) curLabel.textContent = app.currency === 'GBP' ? '£ GBP' : '$ USD';

  // Setup Search Input
  const searchInput = document.getElementById('market-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      marketSearchQuery = e.target.value;
      renderMarkets();
    });
  }

  // Setup initial view
  showView('dashboard');
  startPriceSimulation();
});
