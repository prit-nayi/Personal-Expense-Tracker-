from datetime import datetime, timezone

def test_dashboard_analytics_aggregation(client, auth_headers):
    # Create Account with $3000
    acc = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "Analytics Account", "type": "bank", "opening_balance": 3000.00, "currency": "USD"
    }).json()

    exp_cat = client.get("/api/v1/categories?type=expense", headers=auth_headers).json()[0]
    inc_cat = client.get("/api/v1/categories?type=income", headers=auth_headers).json()[0]

    # Add Expense $200
    client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc["id"],
        "category_id": exp_cat["id"],
        "type": "expense",
        "amount": 200.00,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "description": "Dining expense"
    })

    # Add Income $1000
    client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc["id"],
        "category_id": inc_cat["id"],
        "type": "income",
        "amount": 1000.00,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "description": "Freelance project payment"
    })

    # Get Dashboard Analytics
    res = client.get("/api/v1/analytics/dashboard", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    summary = data["summary"]
    # Total balance = 3000 - 200 + 1000 = 3800
    assert float(summary["total_balance"]) == 3800.00
    assert float(summary["period_income"]) == 1000.00
    assert float(summary["period_expenses"]) == 200.00
    assert float(summary["period_net_savings"]) == 800.00
    assert summary["savings_rate_percentage"] == 80.0

    assert len(data["category_spending"]) >= 1
    assert len(data["monthly_trends"]) == 6
    assert len(data["recent_transactions"]) >= 2
