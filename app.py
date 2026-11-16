import os
import time
import math
import random
import sqlite3
import hashlib
import secrets
from datetime import datetime, timezone
from functools import wraps
from flask import Flask, request, jsonify, render_template, send_from_directory, session

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'mustard.db')

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# -----------------------------------------------------------------------------
# Asset Universe: UK FTSE 100 Equities & Leading Cryptocurrencies
# -----------------------------------------------------------------------------
MARKET_ASSETS = [
    # Top UK FTSE 100 Stocks
    {
        'symbol': 'AZN.L',
        'name': 'AstraZeneca PLC',
        'sector': 'Healthcare',
        'asset_type': 'STOCK',
        'description': 'Global biopharmaceutical company specializing in oncology, rare diseases, and vaccines.',
        'base_price': 140.50
    },
    {
        'symbol': 'SHEL.L',
        'name': 'Shell PLC',
        'sector': 'Energy',
        'asset_type': 'STOCK',
        'description': 'Multinational oil and gas supermajor with growing investments in renewable energy.',
        'base_price': 37.50
    },
    {
        'symbol': 'HSBA.L',
        'name': 'HSBC Holdings PLC',
        'sector': 'Financials',
        'asset_type': 'STOCK',
        'description': 'One of the worlds largest banking and financial services organizations.',
        'base_price': 13.60
    },
    {
        'symbol': 'ULVR.L',
        'name': 'Unilever PLC',
        'sector': 'Consumer Goods',
        'asset_type': 'STOCK',
        'description': 'Consumer goods giant owning Dove, Ben & Jerrys, Knorr, and Hellmanns.',
        'base_price': 50.20
    },
    {
        'symbol': 'BP.L',
        'name': 'BP PLC',
        'sector': 'Energy',
        'asset_type': 'STOCK',
        'description': 'Integrated energy company operating across exploration, refining, and biofuels.',
        'base_price': 5.75
    },
    {
        'symbol': 'RR.L',
        'name': 'Rolls-Royce Holdings PLC',
        'sector': 'Aerospace & Defence',
        'asset_type': 'STOCK',
        'description': 'Pioneering power and propulsion systems for civil aerospace and defence.',
        'base_price': 13.65
    },
    {
        'symbol': 'GSK.L',
        'name': 'GSK PLC',
        'sector': 'Healthcare',
        'asset_type': 'STOCK',
        'description': 'Global biopharma company focused on vaccines, HIV, and immunology treatments.',
        'base_price': 19.30
    },
    {
        'symbol': 'BA.L',
        'name': 'BAE Systems PLC',
        'sector': 'Aerospace & Defence',
        'asset_type': 'STOCK',
        'description': 'Leading British multinational defence, aerospace and security company.',
        'base_price': 19.30
    },
    {
        'symbol': 'BARC.L',
        'name': 'Barclays PLC',
        'sector': 'Financials',
        'asset_type': 'STOCK',
        'description': 'Major British universal bank operating in consumer banking and global investment banking.',
        'base_price': 4.30
    },
    {
        'symbol': 'TSCO.L',
        'name': 'Tesco PLC',
        'sector': 'Consumer Goods',
        'asset_type': 'STOCK',
        'description': 'The UKs largest grocery and merchandise retailer with thousands of stores.',
        'base_price': 5.65
    },
    {
        'symbol': 'RIO.L',
        'name': 'Rio Tinto PLC',
        'sector': 'Basic Materials',
        'asset_type': 'STOCK',
        'description': 'Anglo-Australian mining giant producing iron ore, aluminium, and copper.',
        'base_price': 62.20
    },
    {
        'symbol': 'GLEN.L',
        'name': 'Glencore PLC',
        'sector': 'Basic Materials',
        'asset_type': 'STOCK',
        'description': 'Diversified natural resource company and commodity trading powerhouse.',
        'base_price': 5.05
    },
    {
        'symbol': 'LSEG.L',
        'name': 'London Stock Exchange Group',
        'sector': 'Financials',
        'asset_type': 'STOCK',
        'description': 'Global financial markets infrastructure and data provider.',
        'base_price': 98.20
    },
    {
        'symbol': 'NWG.L',
        'name': 'NatWest Group PLC',
        'sector': 'Financials',
        'asset_type': 'STOCK',
        'description': 'Major UK retail and commercial bank serving millions of personal and business customers.',
        'base_price': 6.00
    },
    {
        'symbol': 'LLOY.L',
        'name': 'Lloyds Banking Group PLC',
        'sector': 'Financials',
        'asset_type': 'STOCK',
        'description': 'Britains largest domestic retail bank including Halifax and Bank of Scotland.',
        'base_price': 1.00
    },
    {
        'symbol': 'VOD.L',
        'name': 'Vodafone Group PLC',
        'sector': 'Telecommunications',
        'asset_type': 'STOCK',
        'description': 'Pan-European and African telecommunications company providing 5G and mobile services.',
        'base_price': 1.20
    },
    {
        'symbol': 'DGE.L',
        'name': 'Diageo PLC',
        'sector': 'Consumer Goods',
        'asset_type': 'STOCK',
        'description': 'World leader in premium alcoholic beverages, including Guinness, Smirnoff, and Johnnie Walker.',
        'base_price': 19.35
    },
    {
        'symbol': 'NG.L',
        'name': 'National Grid PLC',
        'sector': 'Utilities',
        'asset_type': 'STOCK',
        'description': 'Electricity and gas transmission utility operating across the UK and northeastern US.',
        'base_price': 12.80
    },

    # Leading Cryptocurrencies (Quoted in GBP)
    {
        'symbol': 'BTC-GBP',
        'name': 'Bitcoin',
        'sector': 'Crypto',
        'asset_type': 'CRYPTO',
        'description': 'The premier decentralized digital currency and global cryptographic store of value.',
        'base_price': 48800.0
    },
    {
        'symbol': 'ETH-GBP',
        'name': 'Ethereum',
        'sector': 'Crypto',
        'asset_type': 'CRYPTO',
        'description': 'Decentralized global computing platform powering smart contracts, web3, and DeFi.',
        'base_price': 1370.0
    },
    {
        'symbol': 'SOL-GBP',
        'name': 'Solana',
        'sector': 'Crypto',
        'asset_type': 'CRYPTO',
        'description': 'High-throughput layer-1 blockchain engineered for ultra-fast, low-cost decentralized applications.',
        'base_price': 54.0
    },
    {
        'symbol': 'XRP-GBP',
        'name': 'XRP',
        'sector': 'Crypto',
        'asset_type': 'CRYPTO',
        'description': 'Digital asset built for instant, borderless financial settlement and liquidity.',
        'base_price': 0.72
    },
    {
        'symbol': 'BNB-GBP',
        'name': 'BNB',
        'sector': 'Crypto',
        'asset_type': 'CRYPTO',
        'description': 'Utility and ecosystem coin powering the BNB Chain and decentralized applications.',
        'base_price': 450.0
    },
    {
        'symbol': 'DOGE-GBP',
        'name': 'Dogecoin',
        'sector': 'Crypto',
        'asset_type': 'CRYPTO',
        'description': 'Popular peer-to-peer digital currency with widespread community support and instant transfers.',
        'base_price': 0.12
    },
    {
        'symbol': 'ADA-GBP',
        'name': 'Cardano',
        'sector': 'Crypto',
        'asset_type': 'CRYPTO',
        'description': 'Proof-of-stake blockchain network focused on security, sustainability, and peer-reviewed research.',
        'base_price': 0.45
    },
    {
        'symbol': 'AVAX-GBP',
        'name': 'Avalanche',
        'sector': 'Crypto',
        'asset_type': 'CRYPTO',
        'description': 'Smart contracts platform built for high transaction finality, security, and enterprise subnets.',
        'base_price': 22.0
    }
]

# Cache for live quotes
QUOTE_CACHE = {
    'last_updated': 0,
    'data': {},
    'session': None,
    'crumb': None
}

# -----------------------------------------------------------------------------
# Database Setup
# -----------------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with sqlite3.connect(DB_PATH) as db:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            cash_balance REAL NOT NULL DEFAULT 10000.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS portfolios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            shares REAL NOT NULL,
            average_buy_price REAL NOT NULL,
            total_invested REAL NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, symbol)
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            stock_name TEXT NOT NULL,
            type TEXT NOT NULL,
            shares REAL NOT NULL,
            price_per_share REAL NOT NULL,
            total_amount REAL NOT NULL,
            realized_pnl REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        ''')
        db.commit()

# Ensure database tables exist immediately on server launch or import
init_db()

# Password Security
def hash_password(password: str, salt: str = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"{salt}${hashed}"

def verify_password(stored_hash: str, password: str) -> bool:
    try:
        salt, expected = stored_hash.split('$', 1)
        test_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return secrets.compare_digest(test_hash, expected)
    except Exception:
        return False

# Auth Decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

# -----------------------------------------------------------------------------
# Market Quotes Service (Equities & Crypto)
# -----------------------------------------------------------------------------
def get_yahoo_session_and_crumb():
    import requests
    s = requests.Session()
    s.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        s.get('https://fc.yahoo.com', timeout=4)
    except Exception:
        pass
    try:
        crumb_r = s.get('https://query2.finance.yahoo.com/v1/test/getcrumb', timeout=4)
        if crumb_r.status_code == 200:
            crumb = crumb_r.text.strip()
            return s, crumb
    except Exception:
        pass
    return None, None

def fetch_live_quotes():
    now = time.time()
    # Cache for 5 seconds to provide rapid real-time updates while avoiding rate limits
    if now - QUOTE_CACHE['last_updated'] < 5 and QUOTE_CACHE['data']:
        return QUOTE_CACHE['data']

    import requests

    symbols = [s['symbol'] for s in MARKET_ASSETS]
    fetched_quotes = {}

    try:
        if not QUOTE_CACHE['session'] or not QUOTE_CACHE['crumb']:
            s, crumb = get_yahoo_session_and_crumb()
            QUOTE_CACHE['session'] = s
            QUOTE_CACHE['crumb'] = crumb

        s = QUOTE_CACHE['session']
        crumb = QUOTE_CACHE['crumb']

        if s and crumb:
            url = f'https://query2.finance.yahoo.com/v7/finance/quote?symbols={",".join(symbols)}&crumb={crumb}'
            res = s.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json().get('quoteResponse', {}).get('result', [])
                for item in data:
                    sym = item.get('symbol')
                    curr = item.get('currency', 'GBP')
                    raw_p = item.get('regularMarketPrice')
                    if raw_p is None:
                        continue

                    # London Stock Exchange equities are quoted in pence (GBp) -> convert to Pounds (£)
                    # Crypto pairs like BTC-GBP are already in GBP -> retain pounds directly
                    if curr == 'GBp':
                        price_gbp = round(raw_p / 100.0, 2)
                    elif raw_p < 1.0:
                        price_gbp = round(raw_p, 4)
                    else:
                        price_gbp = round(raw_p, 2)

                    chg_pct = round(item.get('regularMarketChangePercent', 0), 2)
                    high = item.get('regularMarketDayHigh', raw_p)
                    low = item.get('regularMarketDayLow', raw_p)

                    if curr == 'GBp':
                        high_gbp = round(high / 100.0, 2)
                        low_gbp = round(low / 100.0, 2)
                    elif raw_p < 1.0:
                        high_gbp = round(high, 4)
                        low_gbp = round(low, 4)
                    else:
                        high_gbp = round(high, 2)
                        low_gbp = round(low, 2)

                    volume = item.get('regularMarketVolume', 0)

                    fetched_quotes[sym] = {
                        'price': price_gbp,
                        'change_pct': chg_pct,
                        'day_high': high_gbp,
                        'day_low': low_gbp,
                        'volume': volume,
                        'source': 'Live Feed'
                    }
    except Exception as e:
        print(f"Quote fetch error: {e}")

    # Build final list merging master list with fetched live quotes or realistic simulated movement
    result = []
    for s_info in MARKET_ASSETS:
        sym = s_info['symbol']
        q = fetched_quotes.get(sym)
        
        if q:
            price = q['price']
            chg_pct = q['change_pct']
            high = q['day_high']
            low = q['day_low']
            vol = q['volume']
            src = q['source']
        else:
            # Fallback realistic micro-movement
            prev_price = QUOTE_CACHE['data'].get(sym, {}).get('price', s_info['base_price'])
            drift = (random.random() - 0.495) * 0.004
            raw_calc = max(0.01, prev_price * (1 + drift))
            price = round(raw_calc, 4) if raw_calc < 1.0 else round(raw_calc, 2)
            chg_pct = round(((price - s_info['base_price']) / s_info['base_price']) * 100, 2)
            high = round(max(price, s_info['base_price'] * 1.02), 4 if price < 1.0 else 2)
            low = round(min(price, s_info['base_price'] * 0.98), 4 if price < 1.0 else 2)
            vol = random.randint(1500000, 9500000)
            src = 'Live Simulation'

        # Generate sparkline 10-point intraday history
        spark = []
        cur = price * (1.0 - (chg_pct / 100.0))
        steps = 10
        step_delta = (price - cur) / steps
        for i in range(steps):
            noise = (random.random() - 0.5) * (price * 0.008)
            pt = max(0.0001, cur + (step_delta * i) + noise)
            spark.append(round(pt, 4 if price < 1.0 else 2))
        spark.append(price)

        record = {
            'symbol': sym,
            'name': s_info['name'],
            'sector': s_info['sector'],
            'asset_type': s_info['asset_type'],
            'description': s_info['description'],
            'price': price,
            'change_pct': chg_pct,
            'day_high': high,
            'day_low': low,
            'volume': vol,
            'source': src,
            'sparkline': spark
        }
        result.append(record)
        fetched_quotes[sym] = record

    QUOTE_CACHE['last_updated'] = now
    QUOTE_CACHE['data'] = {s['symbol']: s for s in result}
    return QUOTE_CACHE['data']

# -----------------------------------------------------------------------------
# Auth API Endpoints
# -----------------------------------------------------------------------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not username or len(username) < 2:
        return jsonify({'error': 'Username must be at least 2 characters long.'}), 400
    if not password or len(password) < 3:
        return jsonify({'error': 'Password must be at least 3 characters long.'}), 400

    # Auto-generate a local email if omitted
    if not email:
        email = f"{username.lower()}@investor.local"

    pwd_hash = hash_password(password)

    try:
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute(
                'INSERT INTO users (username, email, password_hash, cash_balance) VALUES (?, ?, ?, 10000.0)',
                (username, email, pwd_hash)
            )
            user_id = cursor.lastrowid
            db.commit()

        session['user_id'] = user_id
        session['username'] = username
        return jsonify({
            'message': 'Account created successfully! You have £10,000.00 ready to invest.',
            'user': {
                'id': user_id,
                'username': username,
                'email': email,
                'cash_balance': 10000.0
            }
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'An account with that username or email already exists. Please sign in instead.'}), 409
    except Exception as e:
        return jsonify({'error': f'Failed to create account: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    login_id = data.get('login', '').strip()
    password = data.get('password', '').strip()

    if not login_id or not password:
        return jsonify({'error': 'Please provide both username/email and password.'}), 400

    with get_db() as db:
        cursor = db.cursor()
        cursor.execute(
            'SELECT id, username, email, password_hash, cash_balance FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)',
            (login_id, login_id)
        )
        user = cursor.fetchone()

    if not user:
        return jsonify({'error': f'No account found matching "{login_id}". Please check spelling or register.'}), 404

    if not verify_password(user['password_hash'], password):
        return jsonify({'error': 'Incorrect password. Please verify your password and try again.'}), 401

    session['user_id'] = user['id']
    session['username'] = user['username']

    return jsonify({
        'message': f'Welcome back, {user["username"]}!',
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'cash_balance': round(user['cash_balance'], 2)
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully.'})

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False, 'user': None})

    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('SELECT id, username, email, cash_balance, created_at FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()

    if not user:
        session.clear()
        return jsonify({'authenticated': False, 'user': None})

    return jsonify({
        'authenticated': True,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'cash_balance': round(user['cash_balance'], 2),
            'created_at': user['created_at']
        }
    })

# -----------------------------------------------------------------------------
# Asset Market Endpoints
# -----------------------------------------------------------------------------
@app.route('/api/stocks', methods=['GET'])
def list_stocks():
    quotes = fetch_live_quotes()
    asset_list = list(quotes.values())
    asset_list.sort(key=lambda x: (x.get('asset_type') != 'STOCK', x['name']))
    return jsonify({
        'stocks': asset_list,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'count': len(asset_list)
    })

@app.route('/api/stocks/<symbol>', methods=['GET'])
def get_stock_detail(symbol):
    symbol = symbol.upper()
    quotes = fetch_live_quotes()
    asset = quotes.get(symbol)
    if not asset:
        return jsonify({'error': f'Asset symbol {symbol} not found.'}), 404
    return jsonify({'stock': asset})

# -----------------------------------------------------------------------------
# Trading & Portfolio Endpoints (Fractional Shares & Crypto)
# -----------------------------------------------------------------------------
@app.route('/api/portfolio', methods=['GET'])
@login_required
def get_portfolio():
    user_id = session['user_id']
    quotes = fetch_live_quotes()

    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('SELECT cash_balance FROM users WHERE id = ?', (user_id,))
        user_row = cursor.fetchone()
        cash = round(user_row['cash_balance'], 2)

        cursor.execute(
            'SELECT symbol, shares, average_buy_price, total_invested FROM portfolios WHERE user_id = ? AND shares > 0.0000001',
            (user_id,)
        )
        portfolio_rows = cursor.fetchall()

    holdings = []
    total_holdings_value = 0.0
    total_cost_basis = 0.0

    for row in portfolio_rows:
        sym = row['symbol']
        shares = row['shares']
        avg_buy = row['average_buy_price']
        cost = row['total_invested']

        asset_info = quotes.get(sym, {})
        current_price = asset_info.get('price', avg_buy)
        name = asset_info.get('name', sym)
        asset_type = asset_info.get('asset_type', 'STOCK')

        current_value = round(shares * current_price, 2)
        pnl = round(current_value - cost, 2)
        pnl_pct = round((pnl / cost) * 100, 2) if cost > 0 else 0.0

        total_holdings_value += current_value
        total_cost_basis += cost

        # Round shares nicely: up to 6 decimals for fractional crypto, up to 4 for stocks
        shares_rounded = round(shares, 6) if asset_type == 'CRYPTO' else round(shares, 4)

        holdings.append({
            'symbol': sym,
            'name': name,
            'asset_type': asset_type,
            'shares': shares_rounded,
            'average_buy_price': round(avg_buy, 4 if avg_buy < 1.0 else 2),
            'current_price': current_price,
            'total_invested': round(cost, 2),
            'current_value': current_value,
            'pnl': pnl,
            'pnl_pct': pnl_pct
        })

    total_portfolio_value = round(cash + total_holdings_value, 2)
    overall_pnl = round(total_portfolio_value - 10000.0, 2)
    overall_pnl_pct = round((overall_pnl / 10000.0) * 100, 2)

    return jsonify({
        'cash_balance': cash,
        'holdings_value': round(total_holdings_value, 2),
        'total_portfolio_value': total_portfolio_value,
        'overall_pnl': overall_pnl,
        'overall_pnl_pct': overall_pnl_pct,
        'holdings': holdings
    })

@app.route('/api/trade/buy', methods=['POST'])
@login_required
def buy_stock():
    user_id = session['user_id']
    data = request.get_json() or {}
    symbol = data.get('symbol', '').strip().upper()
    try:
        shares = float(data.get('shares', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid quantity.'}), 400

    if shares <= 0:
        return jsonify({'error': 'Quantity to buy must be greater than zero.'}), 400

    quotes = fetch_live_quotes()
    asset = quotes.get(symbol)
    if not asset:
        return jsonify({'error': f'Asset symbol {symbol} not recognized.'}), 404

    price = asset['price']
    total_cost = round(shares * price, 2)

    if total_cost < 0.01:
        return jsonify({'error': 'Minimum transaction amount is £0.01.'}), 400

    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('SELECT cash_balance FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found.'}), 404

        cash = user['cash_balance']
        if cash < total_cost:
            return jsonify({
                'error': f'Insufficient cash. You need £{total_cost:,.2f} but only have £{cash:,.2f}.'
            }), 400

        new_cash = round(cash - total_cost, 2)
        cursor.execute('UPDATE users SET cash_balance = ? WHERE id = ?', (new_cash, user_id))

        # Update or Insert into portfolios
        cursor.execute('SELECT shares, average_buy_price, total_invested FROM portfolios WHERE user_id = ? AND symbol = ?', (user_id, symbol))
        existing = cursor.fetchone()

        if existing:
            prev_shares = existing['shares']
            prev_cost = existing['total_invested']
            new_shares = prev_shares + shares
            new_cost = round(prev_cost + total_cost, 2)
            new_avg = round(new_cost / new_shares, 6)
            cursor.execute(
                'UPDATE portfolios SET shares = ?, average_buy_price = ?, total_invested = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND symbol = ?',
                (new_shares, new_avg, new_cost, user_id, symbol)
            )
        else:
            new_shares = shares
            new_cost = total_cost
            new_avg = price
            cursor.execute(
                'INSERT INTO portfolios (user_id, symbol, shares, average_buy_price, total_invested) VALUES (?, ?, ?, ?, ?)',
                (user_id, symbol, new_shares, new_avg, new_cost)
            )

        # Record transaction
        cursor.execute(
            '''INSERT INTO transactions 
               (user_id, symbol, stock_name, type, shares, price_per_share, total_amount, realized_pnl)
               VALUES (?, ?, ?, 'BUY', ?, ?, ?, 0.0)''',
            (user_id, symbol, asset['name'], shares, price, total_cost)
        )
        db.commit()

    unit_label = 'units' if asset.get('asset_type') == 'CRYPTO' else 'shares'
    return jsonify({
        'message': f'Successfully bought {shares:g} {unit_label} of {symbol} at £{price:,.2f} for £{total_cost:,.2f}.',
        'trade': {
            'symbol': symbol,
            'name': asset['name'],
            'type': 'BUY',
            'shares': shares,
            'price': price,
            'total_cost': total_cost,
            'remaining_cash': new_cash
        }
    })

@app.route('/api/trade/sell', methods=['POST'])
@login_required
def sell_stock():
    user_id = session['user_id']
    data = request.get_json() or {}
    symbol = data.get('symbol', '').strip().upper()
    try:
        shares = float(data.get('shares', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid quantity.'}), 400

    if shares <= 0:
        return jsonify({'error': 'Quantity to sell must be greater than zero.'}), 400

    quotes = fetch_live_quotes()
    asset = quotes.get(symbol)
    if not asset:
        return jsonify({'error': f'Asset symbol {symbol} not recognized.'}), 404

    price = asset['price']

    with get_db() as db:
        cursor = db.cursor()
        cursor.execute(
            'SELECT shares, average_buy_price, total_invested FROM portfolios WHERE user_id = ? AND symbol = ?',
            (user_id, symbol)
        )
        holding = cursor.fetchone()

        if not holding or holding['shares'] < shares - 1e-7:
            owned = holding['shares'] if holding else 0.0
            return jsonify({
                'error': f'You only own {owned:g} of {symbol}. Cannot sell {shares:g}.'
            }), 400

        owned_shares = holding['shares']
        avg_buy_price = holding['average_buy_price']
        total_proceeds = round(shares * price, 2)
        cost_of_sold_shares = round(shares * avg_buy_price, 2)
        realized_pnl = round(total_proceeds - cost_of_sold_shares, 2)

        # Update cash
        cursor.execute('SELECT cash_balance FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        new_cash = round(user['cash_balance'] + total_proceeds, 2)
        cursor.execute('UPDATE users SET cash_balance = ? WHERE id = ?', (new_cash, user_id))

        # Update or delete holding
        remaining_shares = round(owned_shares - shares, 8)
        if remaining_shares <= 0.0000001:
            cursor.execute('DELETE FROM portfolios WHERE user_id = ? AND symbol = ?', (user_id, symbol))
        else:
            remaining_cost = round(remaining_shares * avg_buy_price, 2)
            cursor.execute(
                'UPDATE portfolios SET shares = ?, total_invested = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND symbol = ?',
                (remaining_shares, remaining_cost, user_id, symbol)
            )

        # Record transaction
        cursor.execute(
            '''INSERT INTO transactions 
               (user_id, symbol, stock_name, type, shares, price_per_share, total_amount, realized_pnl)
               VALUES (?, ?, ?, 'SELL', ?, ?, ?, ?)''',
            (user_id, symbol, asset['name'], shares, price, total_proceeds, realized_pnl)
        )
        db.commit()

    unit_label = 'units' if asset.get('asset_type') == 'CRYPTO' else 'shares'
    return jsonify({
        'message': f'Sold {shares:g} {unit_label} of {symbol} at £{price:,.2f} for £{total_proceeds:,.2f} (P&L: {"+" if realized_pnl>=0 else ""}{realized_pnl:,.2f}).',
        'trade': {
            'symbol': symbol,
            'name': asset['name'],
            'type': 'SELL',
            'shares': shares,
            'price': price,
            'total_proceeds': total_proceeds,
            'realized_pnl': realized_pnl,
            'remaining_cash': new_cash
        }
    })

@app.route('/api/transactions', methods=['GET'])
@login_required
def get_transactions():
    user_id = session['user_id']
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute(
            '''SELECT id, symbol, stock_name, type, shares, price_per_share, total_amount, realized_pnl, created_at 
               FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 100''',
            (user_id,)
        )
        rows = cursor.fetchall()

    txs = []
    for r in rows:
        txs.append({
            'id': r['id'],
            'symbol': r['symbol'],
            'stock_name': r['stock_name'],
            'type': r['type'],
            'shares': round(r['shares'], 6),
            'price_per_share': round(r['price_per_share'], 4 if r['price_per_share'] < 1.0 else 2),
            'total_amount': round(r['total_amount'], 2),
            'realized_pnl': round(r['realized_pnl'], 2),
            'created_at': r['created_at']
        })

    return jsonify({'transactions': txs})

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    quotes = fetch_live_quotes()
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('SELECT id, username, cash_balance FROM users')
        users = cursor.fetchall()

        leaderboard = []
        for u in users:
            uid = u['id']
            cash = u['cash_balance']
            cursor.execute('SELECT symbol, shares FROM portfolios WHERE user_id = ? AND shares > 0.0000001', (uid,))
            holdings = cursor.fetchall()
            stock_val = sum(h['shares'] * quotes.get(h['symbol'], {}).get('price', 0.0) for h in holdings)
            total_val = round(cash + stock_val, 2)
            pnl = round(total_val - 10000.0, 2)
            pnl_pct = round((pnl / 10000.0) * 100, 2)

            leaderboard.append({
                'username': u['username'],
                'total_value': total_val,
                'pnl': pnl,
                'pnl_pct': pnl_pct,
                'is_current_user': (session.get('user_id') == uid)
            })

    leaderboard.sort(key=lambda x: x['total_value'], reverse=True)
    return jsonify({'leaderboard': leaderboard[:50]})

@app.route('/api/portfolio/reset', methods=['POST'])
@login_required
def reset_portfolio():
    user_id = session['user_id']
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('UPDATE users SET cash_balance = 10000.0 WHERE id = ?', (user_id,))
        cursor.execute('DELETE FROM portfolios WHERE user_id = ?', (user_id,))
        cursor.execute(
            '''INSERT INTO transactions (user_id, symbol, stock_name, type, shares, price_per_share, total_amount, realized_pnl)
               VALUES (?, 'RESET', 'Portfolio Reset to £10,000', 'RESET', 0, 0, 10000, 0)''',
            (user_id,)
        )
        db.commit()
    return jsonify({'message': 'Portfolio successfully reset to initial starting capital of £10,000.00.'})

# -----------------------------------------------------------------------------
# Frontend Routes
# -----------------------------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f"Mustard Investments UK server starting on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
