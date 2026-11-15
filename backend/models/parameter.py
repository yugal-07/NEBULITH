from __future__ import annotations

from typing import Any
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from .base import Base, generate_uuid, utc_now


class ExtractedParameter(Base):
    __tablename__ = "extracted_parameters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True, index=True)
    
    parameter_name = Column(String(100), nullable=False, index=True)
    # raw_value can be string or numeric or dict range
    raw_value = Column(JSON, nullable=False)
    unit = Column(String(50), nullable=True)
    # normalized_value in standard SI units (float or dict with min/max)
    normalized_value = Column(JSON, nullable=True)
    normalized_unit = Column(String(50), nullable=True)
    conversion_failed = Column(Boolean, nullable=False, default=False)
    conversion_error = Column(Text, nullable=True)
    
    page_number = Column(Integer, nullable=True)
    verbatim_quote = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False, default=1.0)
    extraction_method = Column(String(100), nullable=False, default="llm_grounded")
    
    is_conflict = Column(Boolean, nullable=False, default=False)
    conflict_details = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="extracted_parameters")
    chunk = relationship("Chunk", back_populates="extracted_parameters")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_id": self.chunk_id,
            "parameter_name": self.parameter_name,
            "raw_value": self.raw_value,
            "unit": self.unit,
            "normalized_value": self.normalized_value,
            "normalized_unit": self.normalized_unit,
            "conversion_failed": self.conversion_failed,
            "conversion_error": self.conversion_error,
            "page_number": self.page_number,
            "verbatim_quote": self.verbatim_quote,
            "confidence": self.confidence,
            "extraction_method": self.extraction_method,
            "is_conflict": self.is_conflict,
            "conflict_details": self.conflict_details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
