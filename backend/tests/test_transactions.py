from datetime import datetime, timezone

def test_income_and_expense_flow(client, auth_headers):
    # 1. Create account
    acc_res = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "Main Checking",
        "type": "bank",
        "opening_balance": 1000.00,
        "currency": "USD"
    })
    acc_id = acc_res.json()["id"]

    # 2. Get categories
    cat_res = client.get("/api/v1/categories", headers=auth_headers)
    food_cat = next(c for c in cat_res.json() if c["name"] == "Food & Dining")
    salary_cat = next(c for c in cat_res.json() if c["name"] == "Salary")

    # 3. Add Expense ($100)
    tx_exp = client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc_id,
        "category_id": food_cat["id"],
        "type": "expense",
        "amount": 100.00,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "description": "Dinner at Italian Bistro"
    })
    assert tx_exp.status_code == 201

    # Check account balance: 1000 - 100 = 900
    acc_check = client.get(f"/api/v1/accounts/{acc_id}", headers=auth_headers)
    assert float(acc_check.json()["current_balance"]) == 900.00

    # 4. Add Income ($500)
    tx_inc = client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc_id,
        "category_id": salary_cat["id"],
        "type": "income",
        "amount": 500.00,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "description": "Bi-weekly paycheck bonus"
    })
    assert tx_inc.status_code == 201

    # Check account balance: 900 + 500 = 1400
    acc_check2 = client.get(f"/api/v1/accounts/{acc_id}", headers=auth_headers)
    assert float(acc_check2.json()["current_balance"]) == 1400.00

def test_transfer_flow(client, auth_headers):
    # Create Bank and Cash accounts
    bank = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "Bank", "type": "bank", "opening_balance": 1000.00, "currency": "USD"
    }).json()
    cash = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "Cash", "type": "cash", "opening_balance": 50.00, "currency": "USD"
    }).json()

    # Transfer $200 from Bank to Cash
    transfer_res = client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": bank["id"],
        "destination_account_id": cash["id"],
        "type": "transfer",
        "amount": 200.00,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "description": "ATM Withdrawal"
    })
    assert transfer_res.status_code == 201

    # Verify Bank is 800 and Cash is 250
    bank_updated = client.get(f"/api/v1/accounts/{bank['id']}", headers=auth_headers).json()
    cash_updated = client.get(f"/api/v1/accounts/{cash['id']}", headers=auth_headers).json()

    assert float(bank_updated["current_balance"]) == 800.00
    assert float(cash_updated["current_balance"]) == 250.00

def test_transfer_to_same_account_fails(client, auth_headers):
    bank = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "SameBank", "type": "bank", "opening_balance": 500.00, "currency": "USD"
    }).json()

    res = client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": bank["id"],
        "destination_account_id": bank["id"],
        "type": "transfer",
        "amount": 50.00,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "description": "Invalid Transfer"
    })
    assert res.status_code == 422 or res.status_code == 400

def test_transaction_search_and_pagination(client, auth_headers):
    acc = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "FilterBank", "type": "bank", "opening_balance": 500.00, "currency": "USD"
    }).json()
    cat = client.get("/api/v1/categories", headers=auth_headers).json()[0]

    # Create 3 transactions
    client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc["id"], "category_id": cat["id"], "type": "expense",
        "amount": 15.00, "occurred_at": datetime.now(timezone.utc).isoformat(),
        "description": "Starbucks Coffee", "tags": "coffee,morning"
    })
    client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc["id"], "category_id": cat["id"], "type": "expense",
        "amount": 45.00, "occurred_at": datetime.now(timezone.utc).isoformat(),
        "description": "Grocery Mart", "tags": "groceries"
    })

    # Search 'Coffee'
    search_res = client.get("/api/v1/transactions?search=coffee", headers=auth_headers)
    assert search_res.status_code == 200
    assert len(search_res.json()["items"]) == 1
    assert "Starbucks" in search_res.json()["items"][0]["description"]
