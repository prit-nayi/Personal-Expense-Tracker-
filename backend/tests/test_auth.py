def test_register_and_login_success(client):
    register_payload = {
        "email": "alice@example.com",
        "password": "securepassword123",
        "full_name": "Alice Wonderland",
        "currency_code": "USD"
    }
    res = client.post("/api/v1/auth/register", json=register_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["full_name"] == "Alice Wonderland"

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com",
        "password": "securepassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_register_duplicate_email(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "password123",
        "full_name": "Dup User"
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201
    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]

def test_login_invalid_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "bob@example.com",
        "password": "correctpassword"
    })
    res = client.post("/api/v1/auth/login", json={
        "email": "bob@example.com",
        "password": "wrongpassword"
    })
    assert res.status_code == 401

def test_get_current_user_me(client, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "testuser@example.com"
