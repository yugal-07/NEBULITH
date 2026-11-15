from __future__ import annotations

from typing import Any
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from .base import Base, generate_uuid, utc_now, VectorType
from ..core.config import settings


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=False)
    content_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)  # SHA-256 for deduplication
    status = Column(
        String(32),
        nullable=False,
        default="queued",
        index=True,
        # queued | parsing | extracting | embedding | ready | failed | needs_ocr
    )
    error_message = Column(Text, nullable=True)
    progress = Column(Float, nullable=False, default=0.0)
    doc_metadata = Column(JSON, nullable=False, default=dict)  # title, authors, year, doi, schema_summary
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan", order_by="Chunk.chunk_index")
    extracted_parameters = relationship("ExtractedParameter", back_populates="document", cascade="all, delete-orphan")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "filename": self.filename,
            "content_type": self.content_type,
            "file_size_bytes": self.file_size_bytes,
            "file_hash": self.file_hash,
            "status": self.status,
            "progress": self.progress,
            "error_message": self.error_message,
            "metadata": self.doc_metadata or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=False, default=0)
    embedding = Column(VectorType(dim=settings.EMBEDDING_DIMENSION), nullable=True)
    embedding_model = Column(String(100), nullable=True, index=True)
    embedding_dim = Column(Integer, nullable=True)
    page_number = Column(Integer, nullable=True)
    section = Column(String(255), nullable=True)
    char_start = Column(Integer, nullable=True)
    char_end = Column(Integer, nullable=True)
    chunk_metadata = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="chunks")
    extracted_parameters = relationship("ExtractedParameter", back_populates="chunk")

    __table_args__ = (
        Index("ix_chunks_document_index", "document_id", "chunk_index"),
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_index": self.chunk_index,
            "text": self.text,
            "token_count": self.token_count,
            "embedding_model": self.embedding_model,
            "embedding_dim": self.embedding_dim,
            "page_number": self.page_number,
            "section": self.section,
            "char_start": self.char_start,
            "char_end": self.char_end,
            "metadata": self.chunk_metadata or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
