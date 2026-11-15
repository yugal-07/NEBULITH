from __future__ import annotations

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.models import Document, Chunk
from backend.ingestion.pipeline import process_document
from backend.rag.retrieval import SimpleBM25, cosine_similarity, hybrid_retrieve
from backend.rag.generator import verify_quote_in_chunk, generate_grounded_answer

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def test_bm25_ranking():
    corpus = [
        "Jezero crater has smectite clays and olivine basalt lithology.",
        "The McMurdo Dry Valleys of Antarctica feature hyper-arid cold permafrost.",
        "Atacama Desert Yungay core experiences extreme aridity and UV radiation.",
    ]
    bm25 = SimpleBM25(corpus)
    scores = bm25.score("Jezero crater clays")
    assert scores[0] > scores[1]
    assert scores[0] > scores[2]

    atacama_scores = bm25.score("Atacama aridity")
    assert atacama_scores[2] > atacama_scores[0]


def test_cosine_similarity():
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    v3 = [0.0, 1.0, 0.0]
    v4 = [-1.0, 0.0, 0.0]

    assert abs(cosine_similarity(v1, v2) - 1.0) < 1e-5
    assert abs(cosine_similarity(v1, v3) - 0.0) < 1e-5
    assert abs(cosine_similarity(v1, v4) - (-1.0)) < 1e-5


def test_quote_verification():
    chunk_text = (
        "The target environment experiences a mean surface temperature of 215 K with diurnal fluctuations "
        "between 180 K and 255 K. Mean atmospheric surface pressure is recorded at 6.1 mbar."
    )

    # Valid exact and fuzzy whitespace quotes
    assert verify_quote_in_chunk("mean surface temperature of 215 K", chunk_text)
    assert verify_quote_in_chunk("pressure is recorded at 6.1 mbar", chunk_text)
    assert verify_quote_in_chunk("fluctuations between 180 K and 255 K", chunk_text)

    # False/hallucinated quotes
    assert not verify_quote_in_chunk("mean surface temperature of 350 K", chunk_text)
    assert not verify_quote_in_chunk("pressure is 1013 mbar", chunk_text)
    assert not verify_quote_in_chunk("liquid oceans exist on Jezero", chunk_text)


def test_hybrid_retrieval_and_model_filtering(db_session: Session):
    # Ingest two-column fixture
    pdf_path = FIXTURES_DIR / "paper_two_column_table.pdf"
    doc = Document(
        filename="paper_two_column_table.pdf",
        file_path=str(pdf_path),
        content_type="application/pdf",
        file_size_bytes=pdf_path.stat().st_size,
        file_hash="rag_test_jezero_hash",
        status="queued",
    )
    db_session.add(doc)
    db_session.commit()

    process_document(doc.id, db=db_session)

    # Add a dummy chunk with a DIFFERENT embedding model to ensure it is filtered out
    alien_chunk = Chunk(
        document_id=doc.id,
        chunk_index=99,
        text="Alien chunk that should never be retrieved because model does not match",
        token_count=10,
        embedding=[0.5] * settings.EMBEDDING_DIMENSION,
        embedding_model="outdated-deprecated-model-v1",
        embedding_dim=settings.EMBEDDING_DIMENSION,
    )
    db_session.add(alien_chunk)
    db_session.commit()

    # Query
    retrieved, total_searched = hybrid_retrieve(
        db=db_session,
        query="mean surface temperature Jezero",
        top_k=3,
    )
    assert len(retrieved) > 0
    # Confirm alien chunk was excluded
    assert all(r.chunk_id != alien_chunk.id for r in retrieved)
    assert any("215 K" in r.text for r in retrieved)


def test_rag_query_api_grounded_answer(client: TestClient, db_session: Session):
    pdf_path = FIXTURES_DIR / "paper_two_column_table.pdf"
    doc = Document(
        filename="paper_two_column_table.pdf",
        file_path=str(pdf_path),
        content_type="application/pdf",
        file_size_bytes=pdf_path.stat().st_size,
        file_hash="rag_api_jezero_hash",
        status="queued",
    )
    db_session.add(doc)
    db_session.commit()
    process_document(doc.id, db=db_session)

    # API Query
    res = client.post(
        "/api/v1/rag/query",
        json={
            "question": "What is the surface temperature and pressure of Jezero crater?",
            "top_k": 3,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "215 K" in data["answer"]
    assert len(data["citations"]) > 0

    # Verify that all returned citations are verified and quotes exist in source chunks
    for cit in data["citations"]:
        assert cit["verified"] is True
        chunk_obj = db_session.query(Chunk).filter_by(id=cit["chunk_id"]).first()
        assert chunk_obj is not None
        assert verify_quote_in_chunk(cit["quote"], chunk_obj.text)


def test_rag_query_api_unanswerable_question(client: TestClient, db_session: Session):
    # Ask about something completely absent
    res = client.post(
        "/api/v1/rag/query",
        json={
            "question": "What is the depth of the liquid methane ocean on Venus?",
            "top_k": 3,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "not contain information to answer" in data["answer"]
    assert len(data["citations"]) == 0


def test_rag_with_real_svalbard_paper(client: TestClient, db_session: Session):
    svalbard_file = FIXTURES_DIR / "real_open_access_paper.pdf"
    if svalbard_file.exists():
        doc = Document(
            filename="real_open_access_paper.pdf",
            file_path=str(svalbard_file),
            content_type="application/pdf",
            file_size_bytes=svalbard_file.stat().st_size,
            file_hash="svalbard_test_hash_real",
            status="queued",
        )
        db_session.add(doc)
        db_session.commit()
        process_document(doc.id, db=db_session)

        res = client.post(
            "/api/v1/rag/query",
            json={
                "question": "How do terrestrial gullies on Svalbard serve as Martian analogs?",
                "top_k": 3,
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data["retrieved_chunks"]) > 0
        assert "Svalbard" in data["answer"]
