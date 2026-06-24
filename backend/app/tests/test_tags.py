def test_create_tag(client, auth_headers):
    response = client.post("/tags", json={"name": "personal"}, headers=auth_headers)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "personal"


def test_list_tags(client, auth_headers):
    client.post("/tags", json={"name": "work"}, headers=auth_headers)
    client.post("/tags", json={"name": "personal"}, headers=auth_headers)

    response = client.get("/tags", headers=auth_headers)

    assert response.status_code == 200
    names = {tag["name"] for tag in response.json()}
    assert names == {"work", "personal"}


def test_create_duplicate_tag_rejected(client, auth_headers):
    client.post("/tags", json={"name": "work"}, headers=auth_headers)
    response = client.post("/tags", json={"name": "work"}, headers=auth_headers)

    assert response.status_code == 400


def test_tags_require_auth(client):
    response = client.get("/tags")

    assert response.status_code == 403


def test_tags_are_isolated_between_users(client, auth_headers):
    client.post("/tags", json={"name": "work"}, headers=auth_headers)

    client.post("/auth/register", json={"email": "other3@example.com", "password": "anotherpass123"})
    other_login = client.post("/auth/login", json={"email": "other3@example.com", "password": "anotherpass123"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    response = client.get("/tags", headers=other_headers)

    assert response.status_code == 200
    assert response.json() == []
