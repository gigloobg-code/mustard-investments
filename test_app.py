import os
import sys

# Ensure project directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app import app, init_db

def run_tests():
    init_db()

    with app.test_client() as client:
        # 1. Test index page
        res = client.get('/')
        assert res.status_code == 200, f"Index failed: {res.status_code}"
        print("PASS: Index page served successfully (HTTP 200)")

        # 2. Test assets list (equities + crypto)
        res = client.get('/api/stocks')
        assert res.status_code == 200, f"Stocks list failed: {res.status_code}"
        assets = res.json.get('stocks', [])
        crypto_assets = [a for a in assets if a.get('asset_type') == 'CRYPTO']
        stock_assets = [a for a in assets if a.get('asset_type') == 'STOCK']
        print(f"PASS: Fetched {len(assets)} total assets ({len(stock_assets)} UK stocks, {len(crypto_assets)} crypto coins)")
        assert len(crypto_assets) >= 4, "Expected at least 4 crypto assets"
        assert len(stock_assets) >= 15, "Expected at least 15 UK stocks"

        # 3. Test user registration
        res = client.post('/api/auth/register', json={
            'username': 'CryptoKing',
            'email': 'crypto@mustard.co.uk',
            'password': 'securepassword123'
        })
        assert res.status_code in (201, 409), f"Register failed: {res.text}"
        if res.status_code == 201:
            user = res.json.get('user')
            print(f"PASS: Registered user {user['username']} with £{user['cash_balance']:,.2f} starting cash")
        else:
            res = client.post('/api/auth/login', json={
                'login': 'CryptoKing',
                'password': 'securepassword123'
            })
            assert res.status_code == 200
            print("PASS: Logged in existing user")

        # 4. Test Buy Stock Order
        res = client.post('/api/trade/buy', json={
            'symbol': 'AZN.L',
            'shares': 5
        })
        assert res.status_code == 200, f"Stock Buy failed: {res.text}"
        trade = res.json.get('trade')
        print(f"PASS: Stock order: 5 shares of {trade['symbol']} for £{trade['total_cost']:,.2f}")

        # 5. Test Buy Fractional Crypto Order (e.g. 0.05 BTC-GBP)
        res = client.post('/api/trade/buy', json={
            'symbol': 'BTC-GBP',
            'shares': 0.05
        })
        assert res.status_code == 200, f"Crypto Buy failed: {res.text}"
        btc_trade = res.json.get('trade')
        print(f"PASS: Crypto order: 0.05 of {btc_trade['symbol']} for £{btc_trade['total_cost']:,.2f} (Cash left: £{btc_trade['remaining_cash']:,.2f})")

        # 6. Test Buy another Crypto (e.g. 0.5 ETH-GBP)
        res = client.post('/api/trade/buy', json={
            'symbol': 'ETH-GBP',
            'shares': 0.5
        })
        assert res.status_code == 200, f"Crypto Buy failed: {res.text}"
        eth_trade = res.json.get('trade')
        print(f"PASS: Crypto order: 0.5 of {eth_trade['symbol']} for £{eth_trade['total_cost']:,.2f}")

        # 7. Test Portfolio view with both stocks and crypto
        res = client.get('/api/portfolio')
        assert res.status_code == 200
        portfolio = res.json
        print(f"PASS: Portfolio Total: £{portfolio['total_portfolio_value']:,.2f}, Cash: £{portfolio['cash_balance']:,.2f}, Holdings: {len(portfolio['holdings'])}")

        # 8. Test Partial Crypto Sell (e.g. sell 0.02 BTC-GBP)
        res = client.post('/api/trade/sell', json={
            'symbol': 'BTC-GBP',
            'shares': 0.02
        })
        assert res.status_code == 200, f"Crypto Sell failed: {res.text}"
        sell_trade = res.json.get('trade')
        print(f"PASS: Sold 0.02 {sell_trade['symbol']} for £{sell_trade['total_proceeds']:,.2f} (P&L: £{sell_trade['realized_pnl']:,.2f})")

        # 9. Verify remaining BTC holding
        res = client.get('/api/portfolio')
        portfolio = res.json
        btc_holding = next((h for h in portfolio['holdings'] if h['symbol'] == 'BTC-GBP'), None)
        assert btc_holding is not None, "BTC-GBP should still be held"
        assert abs(btc_holding['shares'] - 0.03) < 1e-5, f"Expected 0.03 BTC, got {btc_holding['shares']}"
        print(f"PASS: Verified remaining crypto holding: {btc_holding['shares']} BTC-GBP")

    print("\n>>> ALL TESTS (STOCKS + CRYPTO) PASSED PERFECTLY! <<<")

if __name__ == '__main__':
    run_tests()
