def test_create_note(client, auth_headers):
    response = client.post(
        "/notes",
        json={"title": "Pierwsza notatka", "content": "Treść notatki", "tag_ids": []},
        headers=auth_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Pierwsza notatka"
    assert body["content"] == "Treść notatki"
    assert body["tags"] == []


def test_list_notes_returns_only_own_notes(client, auth_headers):
    client.post("/notes", json={"title": "A", "content": "", "tag_ids": []}, headers=auth_headers)
    client.post("/notes", json={"title": "B", "content": "", "tag_ids": []}, headers=auth_headers)

    response = client.get("/notes", headers=auth_headers)

    assert response.status_code == 200
    titles = {note["title"] for note in response.json()}
    assert titles == {"A", "B"}


def test_get_note_by_id(client, auth_headers):
    created = client.post(
        "/notes", json={"title": "Note", "content": "Content", "tag_ids": []}, headers=auth_headers
    ).json()

    response = client.get(f"/notes/{created['id']}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_nonexistent_note_returns_404(client, auth_headers):
    response = client.get("/notes/999999", headers=auth_headers)

    assert response.status_code == 404


def test_update_note(client, auth_headers):
    created = client.post(
        "/notes", json={"title": "Old title", "content": "Old content", "tag_ids": []}, headers=auth_headers
    ).json()

    response = client.put(
        f"/notes/{created['id']}",
        json={"title": "New title", "content": "New content", "tag_ids": []},
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "New title"
    assert body["content"] == "New content"


def test_delete_note(client, auth_headers):
    created = client.post(
        "/notes", json={"title": "Note", "content": "", "tag_ids": []}, headers=auth_headers
    ).json()

    delete_response = client.delete(f"/notes/{created['id']}", headers=auth_headers)
    get_response = client.get(f"/notes/{created['id']}", headers=auth_headers)

    assert delete_response.status_code == 204
    assert get_response.status_code == 404


def test_filter_notes_by_tag(client, auth_headers):
    work_tag = client.post("/tags", json={"name": "work"}, headers=auth_headers).json()
    client.post(
        "/notes", json={"title": "Work note", "content": "", "tag_ids": [work_tag["id"]]}, headers=auth_headers
    )
    client.post("/notes", json={"title": "Other note", "content": "", "tag_ids": []}, headers=auth_headers)

    response = client.get("/notes", params={"tag": "work"}, headers=auth_headers)

    assert response.status_code == 200
    titles = [note["title"] for note in response.json()]
    assert titles == ["Work note"]


def test_search_notes_by_content(client, auth_headers):
    client.post(
        "/notes",
        json={"title": "Budget meeting", "content": "Discuss Q3 budget", "tag_ids": []},
        headers=auth_headers,
    )
    client.post(
        "/notes", json={"title": "Grocery list", "content": "Milk, eggs", "tag_ids": []}, headers=auth_headers
    )

    response = client.get("/notes", params={"search": "budget"}, headers=auth_headers)

    assert response.status_code == 200
    titles = [note["title"] for note in response.json()]
    assert titles == ["Budget meeting"]


def test_notes_are_isolated_between_users(client, auth_headers):
    client.post("/notes", json={"title": "Mine", "content": "", "tag_ids": []}, headers=auth_headers)

    client.post("/auth/register", json={"email": "other@example.com", "password": "anotherpass123"})
    other_login = client.post("/auth/login", json={"email": "other@example.com", "password": "anotherpass123"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    response = client.get("/notes", headers=other_headers)

    assert response.status_code == 200
    assert response.json() == []


def test_cannot_access_other_users_note(client, auth_headers):
    created = client.post(
        "/notes", json={"title": "Mine", "content": "", "tag_ids": []}, headers=auth_headers
    ).json()

    client.post("/auth/register", json={"email": "other2@example.com", "password": "anotherpass123"})
    other_login = client.post("/auth/login", json={"email": "other2@example.com", "password": "anotherpass123"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    response = client.get(f"/notes/{created['id']}", headers=other_headers)

    assert response.status_code == 404
