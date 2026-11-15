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
from .base import Base, generate_uuid, utc_now


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    criteria_set_id = Column(String(36), ForeignKey("criteria_sets.id"), nullable=False, index=True)
    criteria_set_version = Column(Integer, nullable=False, default=1)
    document_ids = Column(JSON, nullable=False, default=list)  # list of doc ids involved
    
    status = Column(
        String(32),
        nullable=False,
        default="queued",
        index=True,
        # queued | running | completed | failed
    )
    progress = Column(Float, nullable=False, default=0.0)
    top_n = Column(Integer, nullable=False, default=10)
    error_message = Column(Text, nullable=True)
    summary_metrics = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    criteria_set = relationship("CriteriaSet", back_populates="analysis_runs")
    candidates = relationship("Candidate", back_populates="analysis_run", cascade="all, delete-orphan", order_by="Candidate.rank")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "criteria_set_id": self.criteria_set_id,
            "criteria_set_version": self.criteria_set_version,
            "document_ids": self.document_ids or [],
            "status": self.status,
            "progress": self.progress,
            "top_n": self.top_n,
            "error_message": self.error_message,
            "summary_metrics": self.summary_metrics or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    analysis_run_id = Column(String(36), ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    name = Column(String(200), nullable=False)
    country = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    region_geojson = Column(JSON, nullable=False)  # GeoJSON dict
    suitability_score = Column(Float, nullable=False)  # 0 - 100
    data_coverage = Column(Float, nullable=False)  # 0.0 - 1.0
    confidence = Column(Float, nullable=False, default=1.0)
    criteria_breakdown = Column(JSON, nullable=False, default=list)
    differences = Column(JSON, nullable=False, default=list)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    analysis_run = relationship("AnalysisRun", back_populates="candidates")
    evidence = relationship("CandidateEvidence", back_populates="candidate", cascade="all, delete-orphan")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "analysis_run_id": self.analysis_run_id,
            "rank": self.rank,
            "name": self.name,
            "country": self.country,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "region_geojson": self.region_geojson,
            "suitability_score": self.suitability_score,
            "data_coverage": self.data_coverage,
            "confidence": self.confidence,
            "criteria_breakdown": self.criteria_breakdown or [],
            "differences": self.differences or [],
            "evidence": [e.to_dict() for e in self.evidence] if self.evidence else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CandidateEvidence(Base):
    __tablename__ = "candidate_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    page = Column(Integer, nullable=True)
    quote = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="evidence")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "document_id": self.document_id,
            "chunk_id": self.chunk_id,
            "title": self.title,
            "page": self.page,
            "quote": self.quote,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
