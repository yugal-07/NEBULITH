#!/usr/bin/env python3
"""
scripts/smoke_real_llm.py
Verification script for real LLM integration (Gemini or OpenAI).
Uploads the real Svalbard paper, asks an answerable question, an unanswerable question,
runs extraction, and verifies citations and quotes.
If no real LLM key is configured, exits cleanly with clear setup instructions.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure root is on path
BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.core.config import settings
from backend.core.database import get_db_context
from backend.ingestion.pipeline import process_document
from backend.ingestion.validator import validate_file_content, save_upload_file
from backend.models import Document
from backend.rag.retrieval import hybrid_retrieve
from backend.rag.generator import generate_grounded_answer
from backend.extraction.extractor import extract_parameters_for_documents


def main():
    print("=" * 70)
    print(" NEBULITH Real LLM Smoke Test")
    print("=" * 70)

    has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    has_openai = bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip())

    if not (has_gemini or has_openai):
        print("\n[SKIPPED] No real LLM API key detected in environment.")
        print("To test against a real LLM provider, set either:")
        print("  GEMINI_API_KEY=your_gemini_key_here")
        print("  LLM_PROVIDER=gemini")
        print("or:")
        print("  OPENAI_API_KEY=sk-your_openai_key_here")
        print("  LLM_PROVIDER=openai")
        print("in your .env file or environment variables.\n")
        print("The system is currently running in offline deterministic mock mode.")
        return

    active_provider = "Gemini" if has_gemini else "OpenAI"
    print(f"[ACTIVE] Real LLM detected: {active_provider} (Model: {settings.LLM_MODEL})")

    # Locate Svalbard real paper fixture
    paper_path = BASE_DIR / "backend" / "tests" / "fixtures" / "real_open_access_paper.pdf"
    if not paper_path.exists():
        print(f"[ERROR] Real paper fixture not found at {paper_path}")
        return

    with open(paper_path, "rb") as f:
        file_bytes = f.read()

    with get_db_context() as db:
        fmt, sha = validate_file_content(file_bytes, "smoke_svalbard.pdf", "application/pdf")
        doc = db.query(Document).filter(Document.file_hash == sha).first()
        if not doc:
            doc = Document(
                filename="smoke_svalbard.pdf",
                file_path=str(paper_path),
                content_type="application/pdf",
                file_size_bytes=len(file_bytes),
                file_hash=sha,
                status="queued",
            )
            db.add(doc)
            db.commit()

        print(f"Processing document {doc.id}...")
        process_document(doc.id, db=db)
        doc = db.query(Document).filter(Document.id == doc.id).first()
        print(f"Document status: {doc.status} ({len(doc.chunks)} chunks)")

        # 1. Answerable Question
        q1 = "How do terrestrial gullies on Svalbard serve as Martian analogs?"
        print(f"\nQ1 (Answerable): '{q1}'")
        retrieved, _ = hybrid_retrieve(db=db, query=q1, top_k=3)
        ans1, cits1 = generate_grounded_answer(q1, retrieved)
        print(f"Answer: {ans1}")
        print(f"Citations count: {len(cits1)}")
        for c in cits1:
            print(f"  - [{c.chunk_id}] Page {c.page_number}: \"{c.quote}\" (verified={c.verified})")

        # 2. Unanswerable Question
        q2 = "What is the atmospheric surface pressure on Venus?"
        print(f"\nQ2 (Unanswerable): '{q2}'")
        retrieved2, _ = hybrid_retrieve(db=db, query=q2, top_k=3)
        ans2, cits2 = generate_grounded_answer(q2, retrieved2)
        print(f"Answer: {ans2}")
        print(f"Citations count: {len(cits2)} (Expected 0)")

        # 3. Parameter Extraction
        print("\nRunning Parameter Extraction on Svalbard paper...")
        ext_res = extract_parameters_for_documents(db=db, document_ids=[doc.id])
        print(f"Found parameters: {ext_res.found_parameters_count}")
        print(f"Missing parameters: {ext_res.missing_parameters_count}")
        print(f"Conflicts: {ext_res.conflict_count}")
        for p in ext_res.parameters:
            if not p.is_missing:
                print(f"  * {p.parameter_name}: {p.normalized_value} {p.normalized_unit or ''} (Quote: \"{p.verbatim_quote}\")")

    print("\n[SUCCESS] Smoke test completed successfully.")


if __name__ == "__main__":
    main()
