import pytest
from app.core.security import create_access_token, decode_access_token

def test_s4_pyjwt_token_encode_decode():
    token = create_access_token(subject="test_user_id_123")
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded == "test_user_id_123"
    # Invalid token returns None
    assert decode_access_token("not-a-valid-token") is None

def test_s3_category_ownership_returns_404(client):
    # Register user 1 and create custom category
    r1 = client.post("/api/v1/auth/register", json={
        "email": "user1_s3@example.com",
        "password": "Password123!",
        "full_name": "User One"
    })
    token1 = r1.json()["access_token"]
    cat_res = client.post(
        "/api/v1/categories/",
        headers={"Authorization": f"Bearer {token1}"},
        json={"name": "User1 Only", "type": "expense", "icon": "Tag", "color": "#000000"}
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # Register user 2 and attempt to edit/delete user 1's category -> must return 404
    r2 = client.post("/api/v1/auth/register", json={
        "email": "user2_s3@example.com",
        "password": "Password123!",
        "full_name": "User Two"
    })
    token2 = r2.json()["access_token"]

    update_res = client.put(
        f"/api/v1/categories/{cat_id}",
        headers={"Authorization": f"Bearer {token2}"},
        json={"name": "Hacked Category"}
    )
    assert update_res.status_code == 404

    delete_res = client.delete(
        f"/api/v1/categories/{cat_id}",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert delete_res.status_code == 404
