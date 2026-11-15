from __future__ import annotations

import os
from pathlib import Path
from typing import Any
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from ...core.config import settings
from ...core.database import get_db
from ...core.errors import BadRequestError, NotFoundError
from ...core.logging import logger
from ...models import Document
from ...ingestion.validator import validate_file_content, save_upload_file, sanitize_filename
from ...ingestion.pipeline import process_document

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Upload one or more scientific documents (PDF, DOCX, CSV, XLSX).
    Validates magic bytes, file size, dedupes via SHA-256, stores securely,
    and enqueues background processing.
    """
    if not files:
        raise BadRequestError("No files uploaded.")

    enqueued_docs = []

    for file in files:
        filename = sanitize_filename(file.filename or "uploaded_document")
        file_bytes = await file.read()

        # Validate format, magic bytes, size, and compute hash
        detected_format, file_hash = validate_file_content(
            file_bytes=file_bytes,
            filename=filename,
            content_type=file.content_type or "application/octet-stream",
        )

        # Check for existing document with identical SHA-256 hash (deduplication)
        existing_doc = db.query(Document).filter(Document.file_hash == file_hash).first()
        if existing_doc:
            logger.info(f"Duplicate document detected: {filename} matches existing {existing_doc.id}")
            enqueued_docs.append({
                "document_id": existing_doc.id,
                "filename": existing_doc.filename,
                "status": existing_doc.status,
                "is_duplicate": True,
            })
            continue

        # Create new document record with status "queued"
        doc = Document(
            filename=filename,
            file_path="",  # will update after saving
            content_type=file.content_type or f"application/{detected_format}",
            file_size_bytes=len(file_bytes),
            file_hash=file_hash,
            status="queued",
            progress=0.0,
            doc_metadata={"detected_format": detected_format},
        )
        db.add(doc)
        db.flush()  # Generate doc.id

        # Save file to storage path
        saved_path = save_upload_file(file_bytes=file_bytes, filename=filename, doc_id=doc.id)
        doc.file_path = str(saved_path)
        db.commit()

        # Enqueue background processing job
        background_tasks.add_task(process_document, doc.id)

        enqueued_docs.append({
            "document_id": doc.id,
            "filename": doc.filename,
            "status": doc.status,
            "is_duplicate": False,
        })

    return {
        "message": f"Successfully queued {len(enqueued_docs)} document(s) for ingestion.",
        "documents": enqueued_docs,
    }


@router.get("", response_model=list[dict[str, Any]])
def list_documents(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """List all uploaded documents."""
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [d.to_dict() for d in docs]


@router.get("/{document_id}", response_model=dict[str, Any])
def get_document(document_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Retrieve details for a single document, including metadata and chunk count."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise NotFoundError(f"Document with ID '{document_id}' not found.")
    
    data = doc.to_dict()
    data["chunk_count"] = len(doc.chunks)
    return data


@router.get("/{document_id}/status", response_model=dict[str, Any])
def get_document_status(document_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """
    Get current ingestion status.
    Possible states: queued | parsing | extracting | embedding | ready | failed | needs_ocr
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise NotFoundError(f"Document with ID '{document_id}' not found.")

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "progress": doc.progress,
        "error_message": doc.error_message,
        "chunks_ready": len(doc.chunks) if doc.status == "ready" else 0,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document, its database chunks, and remove file from disk."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise NotFoundError(f"Document with ID '{document_id}' not found.")

    # Remove file from disk
    if doc.file_path:
        try:
            p = Path(doc.file_path)
            if p.exists():
                p.unlink()
        except Exception as e:
            logger.warning(f"Failed to delete file from disk: {doc.file_path}: {e}")

    db.delete(doc)
    db.commit()
    return None
