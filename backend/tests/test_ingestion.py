from __future__ import annotations

import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.models import Document, Chunk
from backend.ingestion.validator import validate_file_content, sanitize_filename
from backend.ingestion.pipeline import process_document
from scripts.reembed import reembed_chunks

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def test_filename_sanitization():
    assert sanitize_filename("../../etc/passwd.pdf") == "passwd.pdf"
    assert sanitize_filename("my report (1).pdf") == "my_report__1_.pdf"
    assert sanitize_filename(".hidden.csv") == "document_.hidden.csv"


def test_security_rejected_executables():
    # File with .pdf extension but Windows EXE magic bytes
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00" + b"\x00" * 100
    with pytest.raises(Exception) as exc:
        validate_file_content(fake_exe, "malicious.pdf", "application/pdf")
    assert "Executable files" in str(exc.value)


def test_security_rejected_html():
    fake_html = b"<!DOCTYPE html><html><body><h1>Fake PDF</h1></body></html>"
    with pytest.raises(Exception) as exc:
        validate_file_content(fake_html, "phishing.pdf", "application/pdf")
    assert "HTML files are not supported" in str(exc.value)


def test_security_rejected_empty_file():
    with pytest.raises(Exception) as exc:
        validate_file_content(b"", "empty.pdf", "application/pdf")
    assert "empty" in str(exc.value).lower()


def test_corrupt_pdf_clean_failure(db_session: Session):
    corrupt_file = FIXTURES_DIR / "corrupt.pdf"
    doc = Document(
        filename="corrupt.pdf",
        file_path=str(corrupt_file),
        content_type="application/pdf",
        file_size_bytes=corrupt_file.stat().st_size,
        file_hash="corrupt_hash_1",
        status="queued",
    )
    db_session.add(doc)
    db_session.commit()

    processed_doc = process_document(doc.id, db=db_session)
    assert processed_doc.status == "failed"
    assert processed_doc.progress == 1.0
    assert "Corrupted or invalid PDF" in (processed_doc.error_message or "")


def test_encrypted_pdf_clean_failure(db_session: Session):
    encrypted_file = FIXTURES_DIR / "encrypted.pdf"
    doc = Document(
        filename="encrypted.pdf",
        file_path=str(encrypted_file),
        content_type="application/pdf",
        file_size_bytes=encrypted_file.stat().st_size,
        file_hash="encrypted_hash_1",
        status="queued",
    )
    db_session.add(doc)
    db_session.commit()

    processed_doc = process_document(doc.id, db=db_session)
    assert processed_doc.status == "failed"
    assert processed_doc.progress == 1.0
    assert "Password-protected" in (processed_doc.error_message or "")


def test_scanned_pdf_needs_ocr(db_session: Session):
    scanned_file = FIXTURES_DIR / "scanned_image_paper.pdf"
    doc = Document(
        filename="scanned_image_paper.pdf",
        file_path=str(scanned_file),
        content_type="application/pdf",
        file_size_bytes=scanned_file.stat().st_size,
        file_hash="scanned_hash_1",
        status="queued",
    )
    db_session.add(doc)
    db_session.commit()

    processed_doc = process_document(doc.id, db=db_session)
    assert processed_doc.status == "needs_ocr"
    assert processed_doc.progress == 1.0
    assert "OCR required" in (processed_doc.error_message or "")


def test_two_column_pdf_full_ingestion(db_session: Session):
    pdf_file = FIXTURES_DIR / "paper_two_column_table.pdf"
    doc = Document(
        filename="paper_two_column_table.pdf",
        file_path=str(pdf_file),
        content_type="application/pdf",
        file_size_bytes=pdf_file.stat().st_size,
        file_hash="jezero_hash_1",
        status="queued",
    )
    db_session.add(doc)
    db_session.commit()

    processed_doc = process_document(doc.id, db=db_session)
    assert processed_doc.status == "ready"
    assert processed_doc.progress == 1.0
    assert processed_doc.doc_metadata.get("doi") == "10.1029/2021JE006890"

    chunks = db_session.query(Chunk).filter_by(document_id=doc.id).order_by(Chunk.chunk_index).all()
    assert len(chunks) >= 3

    # Check embedding model and dimension were saved
    for c in chunks:
        assert c.embedding_model == settings.EMBEDDING_MODEL
        assert c.embedding_dim == settings.EMBEDDING_DIMENSION
        assert isinstance(c.embedding, list)
        assert len(c.embedding) == settings.EMBEDDING_DIMENSION

    # Verify column reading order
    text_c1 = chunks[1].text
    text_c2 = chunks[2].text
    assert "1. Environmental Setting" in chunks[1].section or "1. Environmental Setting" in text_c1
    assert "215 K" in text_c1
    assert "smectite clays" in text_c2 or "2. Lithology" in text_c2


def test_docx_ingestion(db_session: Session):
    docx_file = FIXTURES_DIR / "sample_field_study.docx"
    doc = Document(
        filename="sample_field_study.docx",
        file_path=str(docx_file),
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size_bytes=docx_file.stat().st_size,
        file_hash="docx_hash_1",
        status="queued",
    )
    db_session.add(doc)
    db_session.commit()

    processed_doc = process_document(doc.id, db=db_session)
    assert processed_doc.status == "ready"
    assert "McMurdo" in processed_doc.doc_metadata.get("title", "") or "Antarctic" in processed_doc.doc_metadata.get("title", "")

    chunks = db_session.query(Chunk).filter_by(document_id=doc.id).all()
    assert len(chunks) >= 1
    # Check table was converted to structured markdown
    table_found = any("| Site Name |" in c.text for c in chunks)
    assert table_found


def test_csv_ingestion(db_session: Session):
    csv_file = FIXTURES_DIR / "analog_locations.csv"
    doc = Document(
        filename="analog_locations.csv",
        file_path=str(csv_file),
        content_type="text/csv",
        file_size_bytes=csv_file.stat().st_size,
        file_hash="csv_hash_1",
        status="queued",
    )
    db_session.add(doc)
    db_session.commit()

    processed_doc = process_document(doc.id, db=db_session)
    assert processed_doc.status == "ready"
    schema = processed_doc.doc_metadata.get("schema_summary", {})
    assert schema["coordinate_fields"]["latitude"] == "latitude"
    assert schema["coordinate_fields"]["longitude"] == "longitude"
    assert schema["column_units"]["mean_temp_k"] == "K"
    assert schema["column_units"]["annual_precip_mm"] == "mm"


def test_xlsx_ingestion(db_session: Session):
    xlsx_file = FIXTURES_DIR / "planetary_analogs.xlsx"
    doc = Document(
        filename="planetary_analogs.xlsx",
        file_path=str(xlsx_file),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        file_size_bytes=xlsx_file.stat().st_size,
        file_hash="xlsx_hash_1",
        status="queued",
    )
    db_session.add(doc)
    db_session.commit()

    processed_doc = process_document(doc.id, db=db_session)
    assert processed_doc.status == "ready"
    schema = processed_doc.doc_metadata.get("schema_summary", {})
    assert schema["coordinate_fields"]["latitude"] == "lat"
    assert schema["coordinate_fields"]["longitude"] == "lon"


def test_reembed_script_execution(db_session: Session):
    # Create chunks with old model name
    doc = Document(
        filename="test_reembed.txt",
        file_path="/fake/path",
        content_type="text/plain",
        file_size_bytes=10,
        file_hash="reembed_hash_1",
        status="ready",
    )
    db_session.add(doc)
    db_session.commit()

    c1 = Chunk(
        document_id=doc.id,
        chunk_index=0,
        text="Martian basalt analog testing",
        token_count=4,
        embedding=[0.0] * 384,
        embedding_model="old-model-v0",
        embedding_dim=384,
    )
    db_session.add(c1)
    db_session.commit()

    # Re-embed script should update it
    updated = reembed_chunks(force_all=False, db=db_session)
    assert updated >= 1

    fetched_chunk = db_session.query(Chunk).filter_by(id=c1.id).first()
    assert fetched_chunk.embedding_model == settings.EMBEDDING_MODEL
    assert fetched_chunk.embedding_dim == settings.EMBEDDING_DIMENSION


def test_documents_api_upload_and_status(client: TestClient):
    csv_file = FIXTURES_DIR / "analog_locations.csv"
    with open(csv_file, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/v1/documents",
        files=[("files", ("analog_locations.csv", io.BytesIO(file_bytes), "text/csv"))],
    )
    assert response.status_code == 202
    data = response.json()
    assert len(data["documents"]) == 1
    doc_id = data["documents"][0]["id"]
    assert "document_id" not in data["documents"][0]
    assert data["documents"][0]["status"] == "queued"

    # Query status endpoint
    status_res = client.get(f"/api/v1/documents/{doc_id}/status")
    assert status_res.status_code == 200
    st_data = status_res.json()
    assert st_data["document_id"] == doc_id
    assert st_data["status"] in ("queued", "parsing", "extracting", "embedding", "ready")

    # Query list
    list_res = client.get("/api/v1/documents")
    assert list_res.status_code == 200
    assert any(d["id"] == doc_id for d in list_res.json())
    detail = client.get(f"/api/v1/documents/{doc_id}").json()
    stored_path = Path(detail["file_path"])
    assert stored_path.name == f"{doc_id}.csv"
    assert settings.UPLOAD_DIR in stored_path.parents

    # Delete
    del_res = client.delete(f"/api/v1/documents/{doc_id}")
    assert del_res.status_code == 204

    # Confirm deletion
    get_res = client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 404
