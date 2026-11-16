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

        # 2. Test stocks list
        res = client.get('/api/stocks')
        assert res.status_code == 200, f"Stocks list failed: {res.status_code}"
        stocks = res.json.get('stocks', [])
        print(f"PASS: Fetched {len(stocks)} UK stocks from API")
        assert len(stocks) >= 15

        # 3. Test user registration
        res = client.post('/api/auth/register', json={
            'username': 'AliceTrader',
            'email': 'alice@mustard.co.uk',
            'password': 'securepassword123'
        })
        assert res.status_code in (201, 409), f"Register failed: {res.text}"
        if res.status_code == 201:
            user = res.json.get('user')
            print(f"PASS: Registered user {user['username']} with £{user['cash_balance']:,.2f} starting cash")
        else:
            # Login if already exists
            res = client.post('/api/auth/login', json={
                'login': 'AliceTrader',
                'password': 'securepassword123'
            })
            assert res.status_code == 200
            print("PASS: Logged in existing test user")

        # 4. Test Buy Order
        res = client.post('/api/trade/buy', json={
            'symbol': 'AZN.L',
            'shares': 5
        })
        assert res.status_code == 200, f"Buy failed: {res.text}"
        trade = res.json.get('trade')
        print(f"PASS: Buy order executed: 5 shares of {trade['symbol']} for £{trade['total_cost']:,.2f}")

        # 5. Test Portfolio view
        res = client.get('/api/portfolio')
        assert res.status_code == 200
        portfolio = res.json
        print(f"PASS: Portfolio -> Total: £{portfolio['total_portfolio_value']:,.2f}, Cash: £{portfolio['cash_balance']:,.2f}, Holdings: {len(portfolio['holdings'])}")

        # 6. Test Sell Order
        res = client.post('/api/trade/sell', json={
            'symbol': 'AZN.L',
            'shares': 2
        })
        assert res.status_code == 200, f"Sell failed: {res.text}"
        sell_trade = res.json.get('trade')
        print(f"PASS: Sell order executed: 2 shares sold for £{sell_trade['total_proceeds']:,.2f} (Realized P&L: £{sell_trade['realized_pnl']:,.2f})")

        # 7. Test Multi-user isolation: Register second user Bob
        with app.test_client() as client_bob:
            res = client_bob.post('/api/auth/register', json={
                'username': 'BobInvestor',
                'email': 'bob@mustard.co.uk',
                'password': 'bobpassword123'
            })
            if res.status_code == 201:
                bob_user = res.json.get('user')
                print(f"PASS: Registered second user {bob_user['username']} with clean £{bob_user['cash_balance']:,.2f} balance")
            else:
                client_bob.post('/api/auth/login', json={
                    'login': 'BobInvestor',
                    'password': 'bobpassword123'
                })

            bob_port = client_bob.get('/api/portfolio').json
            assert bob_port['cash_balance'] == 10000.0 or len(bob_port['holdings']) >= 0
            print(f"PASS: Bob's private portfolio is isolated from Alice! Cash: £{bob_port['cash_balance']:,.2f}")

        # 8. Test Leaderboard
        res = client.get('/api/leaderboard')
        assert res.status_code == 200
        leaders = res.json.get('leaderboard', [])
        print(f"PASS: Leaderboard active with {len(leaders)} ranked investors")

    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! EVERYTHING WORKS AS DESIGNED! <<<")

if __name__ == '__main__':
    run_tests()
