def test_register_creates_user(client):
    response = client.post("/auth/register", json={"email": "alice@example.com", "password": "supersecret123"})

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert "id" in body
    assert "hashed_password" not in body


def test_register_rejects_duplicate_email(client, registered_user):
    response = client.post("/auth/register", json=registered_user)

    assert response.status_code == 400


def test_register_rejects_short_password(client):
    response = client.post("/auth/register", json={"email": "bob@example.com", "password": "short"})

    assert response.status_code == 422


def test_login_returns_token(client, registered_user):
    response = client.post("/auth/login", json=registered_user)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 0


def test_login_rejects_wrong_password(client, registered_user):
    response = client.post("/auth/login", json={"email": registered_user["email"], "password": "wrongpassword"})

    assert response.status_code == 401


def test_login_rejects_unknown_email(client):
    response = client.post("/auth/login", json={"email": "ghost@example.com", "password": "supersecret123"})

    assert response.status_code == 401


def test_notes_endpoint_requires_auth(client):
    response = client.get("/notes")

    assert response.status_code == 403
