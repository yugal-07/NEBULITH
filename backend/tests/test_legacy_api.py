from fastapi.testclient import TestClient


def test_legacy_sources_and_targets(client: TestClient):
    sources_res = client.get("/api/v1/sources")
    assert sources_res.status_code == 200
    assert sources_res.json()["status"] == "not_configured"

    targets_res = client.get("/api/v1/targets?body=mars")
    assert targets_res.status_code == 200
    assert targets_res.json()["items"] == []


def test_legacy_study_crud(client: TestClient):
    create_res = client.post(
        "/api/v1/studies",
        json={"title": "Mars Rover Exploration", "target_body": "mars"},
    )
    assert create_res.status_code == 201
    study = create_res.json()
    assert study["title"] == "Mars Rover Exploration"
    assert study["target_body"] == "mars"
    study_id = study["study_id"]

    get_res = client.get(f"/api/v1/studies/{study_id}")
    assert get_res.status_code == 200
    assert get_res.json()["study_id"] == study_id

    patch_res = client.patch(f"/api/v1/studies/{study_id}", json={"title": "Updated Mars Study"})
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Updated Mars Study"

    del_res = client.delete(f"/api/v1/studies/{study_id}")
    assert del_res.status_code == 204

    get_after_del = client.get(f"/api/v1/studies/{study_id}")
    assert get_after_del.status_code == 404
