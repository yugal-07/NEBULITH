from __future__ import annotations

from typing import Any
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship
from .base import Base, generate_uuid, utc_now


class CriteriaSet(Base):
    __tablename__ = "criteria_sets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)
    target_body = Column(String(50), nullable=False, default="Mars")
    version = Column(Integer, nullable=False, default=1)
    is_draft = Column(Boolean, nullable=False, default=False)
    
    # List of criteria objects:
    # [{
    #    "parameter": "mean_temperature",
    #    "target_min": 210, "target_max": 240, "target_optimal": 225,
    #    "unit": "K",
    #    "weight": 1.0,
    #    "tolerance_function": "trapezoidal", # trapezoidal | gaussian | linear | step
    #    "tolerance_params": {"lower_slack": 10, "upper_slack": 10},
    #    "is_required": false
    # }]
    criteria = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    analysis_runs = relationship("AnalysisRun", back_populates="criteria_set")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "target_body": self.target_body,
            "version": self.version,
            "is_draft": self.is_draft,
            "criteria": self.criteria or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
