def test_create_and_get_accounts(client, auth_headers):
    # Create Bank Account
    res = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "Chase Checking",
        "type": "bank",
        "opening_balance": 1500.50,
        "currency": "USD",
        "description": "Primary Checking"
    })
    assert res.status_code == 201
    account = res.json()
    assert account["name"] == "Chase Checking"
    assert float(account["opening_balance"]) == 1500.50
    assert float(account["current_balance"]) == 1500.50

    # Get accounts list
    res_list = client.get("/api/v1/accounts", headers=auth_headers)
    assert res_list.status_code == 200
    accounts = res_list.json()
    assert any(a["id"] == account["id"] for a in accounts)

def test_update_and_archive_account(client, auth_headers):
    res = client.post("/api/v1/accounts", headers=auth_headers, json={
        "name": "Old Wallet",
        "type": "cash",
        "opening_balance": 50.00,
        "currency": "USD"
    })
    acc_id = res.json()["id"]

    # Update account
    up_res = client.put(f"/api/v1/accounts/{acc_id}", headers=auth_headers, json={
        "name": "Updated Wallet Name"
    })
    assert up_res.status_code == 200
    assert up_res.json()["name"] == "Updated Wallet Name"

    # Archive account
    del_res = client.delete(f"/api/v1/accounts/{acc_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify not in default active accounts list
    res_list = client.get("/api/v1/accounts", headers=auth_headers)
    assert not any(a["id"] == acc_id for a in res_list.json())
