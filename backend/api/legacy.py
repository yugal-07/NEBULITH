from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Literal
import uuid
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from ..core.errors import NotFoundError, ValidationError

router = APIRouter(prefix="/api/v1", tags=["Legacy Compatibility"])


class EvidenceValue(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: float | str | bool | None = None
    unit: str | None = None
    evidence_type: Literal["observed", "derived", "modeled", "inferred", "qualitative", "synthetic_demo"]
    coverage_status: Literal["available", "partial", "not_available", "not_configured", "stale"]
    source_refs: list[str] = Field(default_factory=list)
    spatial_resolution_m: float | None = Field(default=None, gt=0)
    temporal_start: str | None = None
    temporal_end: str | None = None
    uncertainty: dict[str, Any] | None = None
    processing_version: str | None = None

    @model_validator(mode="after")
    def value_requires_coverage(self) -> "EvidenceValue":
        if self.coverage_status in {"not_available", "not_configured"} and self.value is not None:
            raise ValueError("unavailable evidence must have a null value")
        if self.value is not None and not self.unit and isinstance(self.value, (int, float)):
            raise ValueError("numeric evidence requires a unit")
        if self.evidence_type == "synthetic_demo" and self.coverage_status == "available":
            raise ValueError("synthetic demo values cannot claim measured-data coverage")
        return self


class StudyCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    target_body: Literal["earth", "moon", "mars"]
    target_region_id: str | None = None
    mission_profile_id: str | None = None
    weights: dict[str, float] = Field(default_factory=dict)
    constraints: dict[str, Any] = Field(default_factory=dict)


class StudyPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    target_body: Literal["earth", "moon", "mars"] | None = None
    target_region_id: str | None = None
    mission_profile_id: str | None = None
    weights: dict[str, float] | None = None
    constraints: dict[str, Any] | None = None


class Study(StudyCreate):
    study_id: str
    candidate_ids: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str
    data_snapshot_id: str | None = None
    algorithm_version: str | None = None


# In-memory store for legacy studies compatibility
_legacy_studies: dict[str, Study] = {}


@router.get("/sources")
def list_sources() -> dict[str, Any]:
    return {
        "items": [],
        "status": "not_configured",
        "message": "No scientific data products are configured. Visual globe textures are not analysis sources.",
    }


@router.get("/targets")
def list_targets(body: Literal["earth", "moon", "mars"] | None = None) -> dict[str, Any]:
    return {"items": [], "body": body, "status": "not_configured", "message": "No verified target AOIs are configured."}


@router.get("/studies", response_model=list[Study])
def list_studies() -> list[Study]:
    return list(_legacy_studies.values())


@router.post("/studies", response_model=Study, status_code=201)
def create_study(payload: StudyCreate) -> Study:
    now = datetime.now(timezone.utc).isoformat()
    study = Study(
        **payload.model_dump(),
        study_id=f"study-{uuid.uuid4().hex[:8]}",
        created_at=now,
        updated_at=now,
    )
    _legacy_studies[study.study_id] = study
    return study


@router.get("/studies/{study_id}", response_model=Study)
def get_study(study_id: str) -> Study:
    if study_id not in _legacy_studies:
        raise HTTPException(status_code=404, detail={"code": "study_not_found", "message": "Study not found"})
    return _legacy_studies[study_id]


@router.patch("/studies/{study_id}", response_model=Study)
def patch_study(study_id: str, payload: StudyPatch) -> Study:
    if study_id not in _legacy_studies:
        raise HTTPException(status_code=404, detail={"code": "study_not_found", "message": "Study not found"})
    existing = _legacy_studies[study_id].model_dump()
    updates = payload.model_dump(exclude_unset=True)
    if "target_body" in updates and updates["target_body"] is None:
        raise HTTPException(status_code=422, detail={"code": "validation_error", "message": "target_body cannot be null"})
    existing.update(updates)
    existing["updated_at"] = datetime.now(timezone.utc).isoformat()
    updated = Study.model_validate(existing)
    _legacy_studies[study_id] = updated
    return updated


@router.delete("/studies/{study_id}", status_code=204)
def delete_study(study_id: str):
    if study_id not in _legacy_studies:
        raise HTTPException(status_code=404, detail={"code": "study_not_found", "message": "Study not found"})
    del _legacy_studies[study_id]
    return None


@router.post("/studies/{study_id}/discover")
def discover_candidates(study_id: str) -> dict[str, Any]:
    return {
        "study_id": study_id,
        "status": "not_configured",
        "candidates": [],
        "message": "No candidate discovery products configured.",
    }


@router.post("/studies/{study_id}/routes")
def plan_route(study_id: str):
    raise HTTPException(status_code=409, detail={"code": "data_not_configured", "message": "Route rehearsal requires configured elevation"})
