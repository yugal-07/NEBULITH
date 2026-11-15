from __future__ import annotations

import time
from pathlib import Path
from sqlalchemy.orm import Session
from ..core.config import settings
from ..core.database import get_db_context
from ..core.logging import logger
from ..core.providers.embedding import get_embedding_provider
from ..models import Document, Chunk
from .parsers.pdf import parse_pdf
from .parsers.docx import parse_docx
from .parsers.tabular import parse_tabular
from .chunker import chunk_document


def process_document(document_id: str, db: Session | None = None) -> Document:
    """
    Full ingestion workflow for an uploaded document:
    1. Parse (PDF, DOCX, CSV, XLSX)
    2. Scanned detection (needs_ocr)
    3. Structured chunking (~500-800 tokens, header-preserving tables)
    4. Batch embedding with current provider
    5. Deduplication and persistence
    """
    logger.info(f"Starting ingestion pipeline for document: {document_id}")

    if db is not None:
        return _execute_ingestion(document_id, db)
    else:
        with get_db_context() as session:
            return _execute_ingestion(document_id, session)


def _execute_ingestion(document_id: str, db: Session) -> Document:
    doc: Document | None = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        logger.error(f"Document {document_id} not found in database.")
        raise ValueError(f"Document {document_id} not found.")

    try:
        # 1. Update status to parsing
        doc.status = "parsing"
        doc.progress = 0.15
        db.commit()

        file_path = Path(doc.file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Source file not found at {file_path}")

        ext = doc.filename.rsplit(".", 1)[-1].lower() if "." in doc.filename else ""

        # 2. Parse file
        if ext == "pdf":
            parsed = parse_pdf(file_path)
        elif ext == "docx":
            parsed = parse_docx(file_path)
        elif ext in ("csv", "xlsx"):
            parsed = parse_tabular(file_path, file_type=ext)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

        # 3. Check for scanned PDF
        if parsed.needs_ocr:
            doc.status = "needs_ocr"
            doc.progress = 1.0
            doc.error_message = "Document is scanned or has no text layer. OCR required."
            current_meta = dict(doc.doc_metadata or {})
            current_meta.update(parsed.metadata)
            doc.doc_metadata = current_meta
            db.commit()
            logger.warning(f"Document {document_id} marked as 'needs_ocr'")
            return doc

        # 4. Extracting & Chunking
        doc.status = "extracting"
        doc.progress = 0.40
        current_meta = dict(doc.doc_metadata or {})
        current_meta.update(parsed.metadata)
        doc.doc_metadata = current_meta
        db.commit()

        chunks_data = chunk_document(
            parsed,
            target_tokens=settings.CHUNK_SIZE_TOKENS,
            overlap_tokens=settings.CHUNK_OVERLAP_TOKENS,
        )

        if not chunks_data:
            logger.warning(f"No text chunks generated for document {document_id}")
            doc.status = "ready"
            doc.progress = 1.0
            db.commit()
            return doc

        # 5. Embedding
        doc.status = "embedding"
        doc.progress = 0.65
        db.commit()

        provider = get_embedding_provider()
        model_name = settings.EMBEDDING_MODEL
        model_dim = provider.dimension

        batch_size = settings.EMBEDDING_BATCH_SIZE
        db_chunks: list[Chunk] = []
        seen_texts: set[str] = set()

        for i in range(0, len(chunks_data), batch_size):
            batch = chunks_data[i : i + batch_size]
            texts = [c.text for c in batch]
            embeddings = provider.embed_batch(texts)

            for chunk_info, emb in zip(batch, embeddings):
                # Deduplication of identical chunks within the document
                norm_text = chunk_info.text.strip()
                if norm_text in seen_texts:
                    continue
                seen_texts.add(norm_text)

                chunk_obj = Chunk(
                    document_id=doc.id,
                    chunk_index=chunk_info.chunk_index,
                    text=chunk_info.text,
                    token_count=chunk_info.token_count,
                    embedding=emb,
                    embedding_model=model_name,
                    embedding_dim=model_dim,
                    page_number=chunk_info.page_number,
                    section=chunk_info.section,
                    char_start=chunk_info.char_start,
                    char_end=chunk_info.char_end,
                    chunk_metadata=chunk_info.metadata,
                )
                db_chunks.append(chunk_obj)

        # Persist chunks
        db.bulk_save_objects(db_chunks)

        # 6. Mark ready
        doc.status = "ready"
        doc.progress = 1.0
        doc.error_message = None
        db.commit()
        logger.info(f"Ingestion successful for document {document_id}: {len(db_chunks)} chunks persisted.")
        return doc

    except Exception as e:
        logger.exception(f"Ingestion pipeline failed for document {document_id}: {e}")
        doc.status = "failed"
        doc.progress = 1.0
        doc.error_message = str(e)
        db.commit()
        return doc
