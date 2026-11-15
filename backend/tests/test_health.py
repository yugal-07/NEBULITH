from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ok"
    assert "version" in data
    assert "storage" in data
    assert "timestamp" in data


def test_request_id_middleware(client: TestClient):
    response = client.get("/health")
    assert "x-request-id" in response.headers
    assert "x-process-time-ms" in response.headers
