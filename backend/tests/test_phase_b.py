import pytest

def test_b1_invalid_month_format_returns_422(client, auth_headers):
    # Invalid month pattern returns 422
    res1 = client.get("/api/v1/analytics/dashboard?month=2026-13", headers=auth_headers)
    assert res1.status_code == 422
    res2 = client.get("/api/v1/budgets?month=invalid-month", headers=auth_headers)
    assert res2.status_code == 422

def test_b2_invalid_sort_by_returns_422(client, auth_headers):
    # sort_by not in allowlist returns 422
    res = client.get("/api/v1/transactions?sort_by=not_a_real_field", headers=auth_headers)
    assert res.status_code == 422

def test_b5_edit_transaction_on_archived_account_succeeds(client, auth_headers):
    # 1. Create account
    acc_res = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "B5 Test Account",
        "type": "bank",
        "opening_balance": 1000.0,
        "currency": "USD"
    })
    assert acc_res.status_code == 201
    acc_id = acc_res.json()["id"]

    # 2. Get a category
    cat_res = client.get("/api/v1/categories?type_filter=expense", headers=auth_headers)
    cat_id = cat_res.json()[0]["id"]

    # 3. Create transaction
    tx_res = client.post("/api/v1/transactions", headers=auth_headers, json={
        "account_id": acc_id,
        "category_id": cat_id,
        "type": "expense",
        "amount": 50.0,
        "currency": "USD",
        "occurred_at": "2026-11-13T10:00:00Z",
        "description": "Initial description"
    })
    assert tx_res.status_code == 201
    tx_id = tx_res.json()["id"]

    # 4. Archive account
    archive_res = client.delete(f"/api/v1/accounts/{acc_id}", headers=auth_headers)
    assert archive_res.status_code == 200

    # 5. Update transaction description (without changing account) -> must succeed!
    update_res = client.put(f"/api/v1/transactions/{tx_id}", headers=auth_headers, json={
        "description": "Updated description after account archived"
    })
    assert update_res.status_code == 200
    assert update_res.json()["description"] == "Updated description after account archived"
