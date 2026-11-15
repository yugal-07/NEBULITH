from __future__ import annotations

import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.text_utils import normalize_scientific_text, verify_quote_in_text
from backend.extraction.normalizer import (
    normalize_numeric_scalar,
    normalize_parameter_value,
    normalize_parameter_value_detailed,
)
from backend.extraction.extractor import (
    extract_parameters_for_documents,
    extract_parameters_heuristically,
)
from backend.extraction.schemas import RawExtractedItem
from backend.models import Document, Chunk, ExtractedParameter
from backend.ingestion.parsers.pdf import parse_pdf, detect_section_heading

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def test_unit_normalization_temperature():
    # 0 degC -> 273.15 K
    val_k, unit = normalize_numeric_scalar(0.0, "degC", "K")
    assert val_k == 273.15
    assert unit == "K"

    # -20 celsius -> 253.15 K
    val_k2, _ = normalize_numeric_scalar(-20.0, "celsius", "K")
    assert val_k2 == 253.15

    # 32 fahrenheit -> 273.15 K
    val_k3, _ = normalize_numeric_scalar(32.0, "degF", "K")
    assert val_k3 == 273.15

    # 210 K stays 210 K
    val_k4, _ = normalize_numeric_scalar(210.0, "K", "K")
    assert val_k4 == 210.0


def test_unit_normalization_pressure():
    # 6.1 mbar -> 610.0 Pa
    val_pa, unit = normalize_numeric_scalar(6.1, "mbar", "Pa")
    assert val_pa == 610.0
    assert unit == "Pa"

    # 1 bar -> 100000.0 Pa
    val_pa2, _ = normalize_numeric_scalar(1.0, "bar", "Pa")
    assert val_pa2 == 100000.0

    # 1 atm -> 101325.0 Pa
    val_pa3, _ = normalize_numeric_scalar(1.0, "atm", "Pa")
    assert val_pa3 == 101325.0


def test_unit_normalization_precipitation_and_elevation():
    # 50 mm/year -> 50.0 mm/yr
    val_precip, unit = normalize_numeric_scalar(50, "mm/year", "mm/yr")
    assert val_precip == 50.0
    assert unit == "mm/yr"

    # 2.5 km -> 2500.0 m
    val_elev, unit_m = normalize_numeric_scalar(2.5, "km", "m")
    assert val_elev == 2500.0
    assert unit_m == "m"


def test_unit_normalization_range_structures():
    # Range of temperatures in Celsius converted to Kelvin
    range_val = {"min": -80.0, "max": 20.0}
    norm_val, norm_unit = normalize_parameter_value("temperature_range", range_val, "degC")
    assert norm_unit == "K"
    assert norm_val["min"] == 193.15
    assert norm_val["max"] == 293.15


def test_unknown_unit_never_returns_raw_as_normalized_value():
    value, normalized_unit, error = normalize_parameter_value_detailed(
        "mean_temperature", 12.0, "furlong-per-fortnight"
    )
    assert value is None
    assert normalized_unit == "K"
    assert error and "cannot convert" in error


def test_pressure_candidate_matches_recorded_at_phrase():
    chunk = Chunk(
        id="pressure-diagnostic",
        document_id="doc",
        chunk_index=0,
        text="Surface pressure is recorded at 6.1 mbar across the landing basin.",
        token_count=12,
    )
    candidates = extract_parameters_heuristically([chunk])
    pressure = [c for c in candidates if c.parameter_name == "atmospheric_pressure"]
    assert len(pressure) == 1
    assert pressure[0].value == 6.1
    assert pressure[0].unit == "mbar"
    assert verify_quote_in_text(pressure[0].verbatim_quote, chunk.text)


def test_quote_normalization_hyphenation_and_unicode():
    chunk_text = (
        "Geomorphological observations by Hau-\nber et al. revealed polygon patterned "
        "ground resembling Mars. The \uFB02ight showed “dry valleys” with pH 7.8."
    )
    # De-hyphenated quote
    quote1 = "Hauber et al. revealed polygon patterned ground"
    assert verify_quote_in_text(quote1, chunk_text)

    # Unicode ligature (fl: \uFB02) and smart quotes
    quote2 = 'flight showed "dry valleys"'
    assert verify_quote_in_text(quote2, chunk_text)

    # Hallucinated quote should NOT match
    fake_quote = "Hauber et al. discovered active liquid rivers on Mars"
    assert not verify_quote_in_text(fake_quote, chunk_text)
    assert not verify_quote_in_text("the result", chunk_text)


def test_hallucinated_quote_rejected_from_extraction(db_session: Session):
    doc = Document(
        filename="test_reject.pdf",
        file_path="/fake/path",
        content_type="application/pdf",
        file_size_bytes=100,
        file_hash="hash_reject_1",
        status="ready",
    )
    db_session.add(doc)
    db_session.commit()

    chunk = Chunk(
        document_id=doc.id,
        chunk_index=0,
        text="Surface pressure is recorded at 6.1 mbar across the landing basin.",
        token_count=12,
        embedding=[0.0] * 384,
        embedding_model=settings.EMBEDDING_MODEL,
        embedding_dim=settings.EMBEDDING_DIMENSION,
    )
    db_session.add(chunk)
    db_session.commit()

    # 1. Grounded extraction succeeds
    result = extract_parameters_for_documents(db=db_session, document_ids=[doc.id])
    pressure_params = [p for p in result.parameters if p.parameter_name == "atmospheric_pressure"]
    assert len(pressure_params) >= 1
    assert pressure_params[0].normalized_value == 610.0
    assert not pressure_params[0].is_missing

    # 2. Hallucinated quote verification failure
    fake_quote = "Surface pressure is recorded at 1013 mbar with tropical ocean moisture."
    assert not verify_quote_in_text(fake_quote, chunk.text)


def test_missing_parameter_explicitly_flagged(db_session: Session):
    doc = Document(
        filename="sparse_doc.pdf",
        file_path="/fake/sparse",
        content_type="application/pdf",
        file_size_bytes=50,
        file_hash="sparse_hash_1",
        status="ready",
    )
    db_session.add(doc)
    db_session.commit()

    chunk = Chunk(
        document_id=doc.id,
        chunk_index=0,
        text="The study examined lithology composed of olivine-rich basalt.",
        token_count=10,
        embedding=[0.0] * 384,
        embedding_model=settings.EMBEDDING_MODEL,
        embedding_dim=settings.EMBEDDING_DIMENSION,
    )
    db_session.add(chunk)
    db_session.commit()

    result = extract_parameters_for_documents(db=db_session, document_ids=[doc.id])

    # Lithology was found
    lithology = next(p for p in result.parameters if p.parameter_name == "lithology")
    assert not lithology.is_missing
    assert "olivine-rich basalt" in lithology.raw_value.lower()

    # Atmospheric pressure was NOT mentioned, must be flagged as missing
    pressure = next(p for p in result.parameters if p.parameter_name == "atmospheric_pressure")
    assert pressure.is_missing is True
    assert pressure.raw_value is None
    assert pressure.normalized_value is None
    assert pressure.extraction_method == "not_found"


def test_conflicting_sources_flagged_and_preserved(db_session: Session):
    # Two documents disagreeing on surface temperature
    doc1 = Document(
        filename="paper_a.pdf",
        file_path="/fake/a",
        content_type="application/pdf",
        file_size_bytes=50,
        file_hash="hash_a",
        status="ready",
    )
    doc2 = Document(
        filename="paper_b.pdf",
        file_path="/fake/b",
        content_type="application/pdf",
        file_size_bytes=50,
        file_hash="hash_b",
        status="ready",
    )
    db_session.add_all([doc1, doc2])
    db_session.commit()

    c1 = Chunk(
        document_id=doc1.id,
        chunk_index=0,
        text="Mean surface temperature is 210 K across the southern highlands.",
        token_count=11,
        embedding=[0.0] * 384,
        embedding_model=settings.EMBEDDING_MODEL,
        embedding_dim=settings.EMBEDDING_DIMENSION,
    )
    c2 = Chunk(
        document_id=doc2.id,
        chunk_index=0,
        text="Mean surface temperature is 240 K according to orbital radiometry.",
        token_count=11,
        embedding=[0.0] * 384,
        embedding_model=settings.EMBEDDING_MODEL,
        embedding_dim=settings.EMBEDDING_DIMENSION,
    )
    db_session.add_all([c1, c2])
    db_session.commit()

    result = extract_parameters_for_documents(db=db_session, document_ids=[doc1.id, doc2.id])
    assert result.conflict_count >= 1

    temp_items = [p for p in result.parameters if p.parameter_name == "mean_temperature"]
    assert len(temp_items) == 2
    for it in temp_items:
        assert it.is_conflict is True
        assert "conflicting_values" in (it.conflict_details or {})


def test_pdf_heading_detection():
    pdf_path = FIXTURES_DIR / "real_open_access_paper.pdf"
    if pdf_path.exists():
        parsed = parse_pdf(pdf_path)
        sections = {s.title for s in parsed.sections if s.title}
        # Verify detected headings are not just "Page 1"
        assert any(
            sec in ["Abstract", "Introduction", "Geological Setting", "Results", "Discussion"]
            or not sec.startswith("Page")
            for sec in sections
        )


def test_multi_file_upload_per_file_status(client: TestClient):
    # Upload one valid CSV and one malicious executable in one batch
    csv_bytes = b"site,lat,lon\nBasalt Basin,78.2,15.6\n"
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00\x00\x00"

    response = client.post(
        "/api/v1/documents",
        files=[
            ("files", ("valid_data.csv", io.BytesIO(csv_bytes), "text/csv")),
            ("files", ("malicious.exe", io.BytesIO(fake_exe), "application/octet-stream")),
        ],
    )
    assert response.status_code == 202
    data = response.json()
    assert data["total_files"] == 2
    assert data["successful_count"] == 1
    assert data["failed_count"] == 1

    doc_results = data["documents"]
    # Check valid file was accepted
    valid_res = next(d for d in doc_results if d["filename"] == "valid_data.csv")
    assert valid_res["status"] == "queued"
    assert valid_res["id"] is not None

    # Check bad file was rejected with explicit error
    bad_res = next(d for d in doc_results if d["filename"] == "malicious.exe")
    assert bad_res["error"] is not None
    assert "Executable" in bad_res["error"]


def test_cors_preflight(client: TestClient):
    response = client.options(
        "/api/v1/documents",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_rag_config_endpoint(client: TestClient):
    response = client.get("/api/v1/rag/config")
    assert response.status_code == 200
    data = response.json()
    assert "active_llm_provider" in data
    assert "is_real_llm_configured" in data
    assert isinstance(data["is_real_llm_configured"], bool)
    assert data["embedding_model"] == settings.EMBEDDING_MODEL
    assert data["embedding_dimension"] == settings.EMBEDDING_DIMENSION
    assert data["max_top_k"] == 20


def test_extraction_api_endpoints(client: TestClient, db_session: Session):
    doc = Document(
        filename="api_extract_test.pdf",
        file_path="/fake/extract",
        content_type="application/pdf",
        file_size_bytes=120,
        file_hash="api_extract_hash",
        status="ready",
    )
    db_session.add(doc)
    db_session.commit()

    chunk = Chunk(
        document_id=doc.id,
        chunk_index=0,
        text="Mean surface temperature is 218 K and atmospheric pressure is 6.5 mbar. Aridity is hyper-arid.",
        token_count=18,
        embedding=[0.0] * 384,
        embedding_model=settings.EMBEDDING_MODEL,
        embedding_dim=settings.EMBEDDING_DIMENSION,
    )
    db_session.add(chunk)
    db_session.commit()

    # 1. Single document extraction
    res1 = client.post(f"/api/v1/documents/{doc.id}/extract")
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["found_parameters_count"] >= 2

    # 2. Query extracted parameters
    res_params = client.get(f"/api/v1/documents/{doc.id}/parameters")
    assert res_params.status_code == 200
    params_list = res_params.json()
    assert len(params_list) >= 2

    # 3. Batch analysis extraction
    res2 = client.post("/api/v1/analysis/extract", json={"document_ids": [doc.id]})
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["found_parameters_count"] >= 2
    params_after_second_run = client.get(f"/api/v1/documents/{doc.id}/parameters").json()
    assert len(params_after_second_run) == len(params_list)
