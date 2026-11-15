import pytest
from sqlalchemy.orm import Session
from backend.models import (
    Document,
    Chunk,
    ExtractedParameter,
    CriteriaSet,
    AnalysisRun,
    Candidate,
    CandidateEvidence,
)


def test_create_document_and_chunks(db_session: Session):
    doc = Document(
        filename="mars_perseverance_geology.pdf",
        file_path="/storage/uploads/test_file.pdf",
        content_type="application/pdf",
        file_size_bytes=102400,
        file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        status="ready",
        progress=1.0,
        doc_metadata={"title": "Mars Geology at Jezero Crater", "year": 2021},
    )
    db_session.add(doc)
    db_session.commit()

    assert doc.id is not None
    assert doc.status == "ready"

    # Add chunks with embeddings, section, page, char offsets
    chunk1 = Chunk(
        document_id=doc.id,
        chunk_index=0,
        text="The mean surface temperature of Jezero crater is approximately 215 K.",
        token_count=14,
        embedding=[0.123, -0.456, 0.789],
        page_number=3,
        section="1. Environmental Setting",
        char_start=120,
        char_end=190,
    )
    db_session.add(chunk1)
    db_session.commit()

    # Query back and verify VectorType decoding and relationship
    fetched_doc = db_session.query(Document).filter_by(id=doc.id).first()
    assert len(fetched_doc.chunks) == 1
    c = fetched_doc.chunks[0]
    assert c.section == "1. Environmental Setting"
    assert c.page_number == 3
    assert c.char_start == 120
    assert c.char_end == 190
    assert isinstance(c.embedding, list)
    assert len(c.embedding) == 3
    assert abs(c.embedding[0] - 0.123) < 1e-4


def test_extracted_parameter_model(db_session: Session):
    doc = Document(
        filename="martian_atmosphere.pdf",
        file_path="/storage/uploads/martian_atmosphere.pdf",
        content_type="application/pdf",
        file_size_bytes=20480,
        file_hash="hash123456789",
        status="ready",
    )
    db_session.add(doc)
    db_session.commit()

    param = ExtractedParameter(
        document_id=doc.id,
        parameter_name="atmospheric_pressure",
        raw_value="6.1 mbar",
        unit="mbar",
        normalized_value=610.0,
        normalized_unit="Pa",
        page_number=2,
        verbatim_quote="Atmospheric pressure at the landing site is 6.1 mbar.",
        confidence=0.98,
        extraction_method="llm_grounded",
        is_conflict=False,
    )
    db_session.add(param)
    db_session.commit()

    fetched = db_session.query(ExtractedParameter).filter_by(id=param.id).first()
    assert fetched.parameter_name == "atmospheric_pressure"
    assert fetched.normalized_value == 610.0
    assert fetched.normalized_unit == "Pa"
    assert fetched.verbatim_quote.startswith("Atmospheric pressure")


def test_criteria_set_and_analysis_run(db_session: Session):
    crit_set = CriteriaSet(
        name="Mars Surface Analog Search Criteria",
        target_body="Mars",
        version=1,
        criteria=[
            {
                "parameter": "mean_temperature",
                "target_min": 210,
                "target_max": 240,
                "weight": 1.0,
                "tolerance_function": "trapezoidal",
                "is_required": True,
            },
            {
                "parameter": "aridity",
                "target_min": 0.0,
                "target_max": 0.05,
                "weight": 0.8,
                "tolerance_function": "linear",
                "is_required": False,
            },
        ],
    )
    db_session.add(crit_set)
    db_session.commit()

    run = AnalysisRun(
        criteria_set_id=crit_set.id,
        criteria_set_version=1,
        document_ids=["doc-123"],
        status="completed",
        progress=1.0,
        top_n=5,
    )
    db_session.add(run)
    db_session.commit()

    candidate = Candidate(
        analysis_run_id=run.id,
        rank=1,
        name="Atacama Desert (Yungay Core)",
        country="Chile",
        latitude=-24.08,
        longitude=-69.95,
        region_geojson={
            "type": "Polygon",
            "coordinates": [[[-70.0, -24.2], [-69.8, -24.2], [-69.8, -24.0], [-70.0, -24.0], [-70.0, -24.2]]],
        },
        suitability_score=87.5,
        data_coverage=0.95,
        confidence=0.92,
        criteria_breakdown=[
            {"parameter": "aridity", "target": "hyper-arid", "observed": "hyper-arid", "similarity": 0.98, "weight": 0.8, "missing": False}
        ],
        differences=["Observed temperature is 288 K vs target 225 K."],
    )
    db_session.add(candidate)
    db_session.commit()

    evidence = CandidateEvidence(
        candidate_id=candidate.id,
        document_id="doc-123",
        title="Hyper-arid soil analogs",
        page=12,
        quote="The Yungay region in the Atacama is an established planetary analog.",
    )
    db_session.add(evidence)
    db_session.commit()

    # Query back and verify relations
    fetched_run = db_session.query(AnalysisRun).filter_by(id=run.id).first()
    assert len(fetched_run.candidates) == 1
    c = fetched_run.candidates[0]
    assert c.name == "Atacama Desert (Yungay Core)"
    assert c.suitability_score == 87.5
    assert len(c.evidence) == 1
    assert c.evidence[0].page == 12


def test_cascade_deletion(db_session: Session):
    doc = Document(
        filename="sample.pdf",
        file_path="/storage/sample.pdf",
        content_type="application/pdf",
        file_size_bytes=100,
        file_hash="hash999",
    )
    db_session.add(doc)
    db_session.commit()

    chunk = Chunk(document_id=doc.id, chunk_index=0, text="Sample text", token_count=2)
    db_session.add(chunk)
    db_session.commit()

    # Delete the document
    db_session.delete(doc)
    db_session.commit()

    # Verify chunk was cascade deleted
    assert db_session.query(Chunk).filter_by(id=chunk.id).first() is None
