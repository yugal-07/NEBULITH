import os
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


_temp_dir = tempfile.TemporaryDirectory()
os.environ["NEBULITH_DB_PATH"] = str(Path(_temp_dir.name) / "test.sqlite3")

from app.main import EvidenceValue, app  # noqa: E402


class ApiContractTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)

    def test_catalogs_are_explicitly_unconfigured(self):
        self.assertEqual(self.client.get("/api/v1/sources").json()["status"], "not_configured")
        self.assertEqual(self.client.get("/api/v1/targets?body=mars").json()["items"], [])

    def test_study_persists_and_unavailable_data_does_not_score(self):
        created = self.client.post("/api/v1/studies", json={"title": "Mars field study", "target_body": "mars"})
        self.assertEqual(created.status_code, 201)
        study_id = created.json()["study_id"]
        self.assertEqual(self.client.get(f"/api/v1/studies/{study_id}").status_code, 200)
        result = self.client.post(f"/api/v1/studies/{study_id}/discover").json()
        self.assertEqual(result["status"], "not_configured")
        self.assertEqual(result["candidates"], [])

    def test_missing_evidence_is_null_and_numeric_values_need_units(self):
        unavailable = EvidenceValue(evidence_type="derived", coverage_status="not_available")
        self.assertIsNone(unavailable.value)
        with self.assertRaises(ValueError):
            EvidenceValue(value=2.4, evidence_type="observed", coverage_status="available")

    def test_route_rehearsal_is_gated_until_data_is_configured(self):
        created = self.client.post("/api/v1/studies", json={"title": "Mars route", "target_body": "mars"}).json()
        result = self.client.post(f"/api/v1/studies/{created['study_id']}/routes")
        self.assertEqual(result.status_code, 409)
        self.assertEqual(result.json()["error"]["code"], "data_not_configured")

    def test_api_validation_errors_follow_the_structured_contract(self):
        result = self.client.post("/api/v1/studies", json={"title": "", "target_body": "venus"})
        self.assertEqual(result.status_code, 422)
        self.assertEqual(result.json()["error"]["code"], "validation_error")
        self.assertTrue(result.json()["error"]["request_id"])

    def test_studies_can_be_deleted(self):
        created = self.client.post("/api/v1/studies", json={"title": "Temporary", "target_body": "earth"}).json()
        self.assertEqual(self.client.delete(f"/api/v1/studies/{created['study_id']}").status_code, 204)
        self.assertEqual(self.client.get(f"/api/v1/studies/{created['study_id']}").status_code, 404)

    def test_patch_does_not_allow_required_fields_to_become_null(self):
        created = self.client.post("/api/v1/studies", json={"title": "Stable", "target_body": "earth"}).json()
        result = self.client.patch(f"/api/v1/studies/{created['study_id']}", json={"target_body": None})
        self.assertEqual(result.status_code, 422)
        self.assertEqual(result.json()["error"]["code"], "validation_error")


if __name__ == "__main__":
    unittest.main()
