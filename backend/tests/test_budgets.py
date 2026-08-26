from datetime import datetime, timezone

def test_budget_creation_and_utilization(client, auth_headers):
    # 1. Create account & get food category
    acc = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "Budget Checking", "type": "bank", "opening_balance": 2000.00, "currency": "USD"
    }).json()

    cats = client.get("/api/v1/categories?type=expense", headers=auth_headers).json()
    food_cat = next(c for c in cats if "Food" in c["name"])

    now = datetime.now()
    month_str = f"{now.year:04d}-{now.month:02d}"

    # 2. Create budget of $500 for Food in current month
    budget_res = client.post("/api/v1/budgets", headers=auth_headers, json={
        "category_id": food_cat["id"],
        "amount": 500.00,
        "currency": "USD",
        "month": month_str
    })
    assert budget_res.status_code == 201
    budget = budget_res.json()
    assert float(budget["spent_amount"]) == 0.00
    assert float(budget["remaining_amount"]) == 500.00
    assert budget["status"] == "normal"

    # 3. Add Expense of $420 (84% -> warning)
    client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc["id"],
        "category_id": food_cat["id"],
        "type": "expense",
        "amount": 420.00,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "description": "Weekly grocery bulk shopping"
    })

    # 4. Check budget list
    budgets_list = client.get(f"/api/v1/budgets?month={month_str}", headers=auth_headers).json()
    updated_b = next(b for b in budgets_list if b["id"] == budget["id"])
    assert float(updated_b["spent_amount"]) == 420.00
    assert float(updated_b["remaining_amount"]) == 80.00
    assert updated_b["utilization_percentage"] == 84.0
    assert updated_b["status"] == "warning"
