from __future__ import annotations

import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, model_validator


APP_VERSION = "0.1.0"
DB_PATH = Path(os.environ.get("NEBULITH_DB_PATH", Path(__file__).resolve().parents[1] / "data" / "nebulith.sqlite3"))


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ApiError(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    request_id: str


class EvidenceValue(BaseModel):
    """A scientific value with explicit evidence and coverage context."""

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


class Candidate(BaseModel):
    candidate_id: str
    name: str
    geometry: dict[str, Any] | None = None
    region_type: str | None = None
    features: dict[str, EvidenceValue] = Field(default_factory=dict)
    score: float | None = None
    score_config_id: str | None = None
    confidence: float | None = None
    coverage_fraction: float | None = Field(default=None, ge=0, le=1)
    limitations: list[str] = Field(default_factory=list)
    source_refs: list[str] = Field(default_factory=list)


class TransferabilityCondition(BaseModel):
    condition_id: str
    experiment: str
    target_condition: EvidenceValue
    classification: Literal["transferable", "partial", "non_transferable", "unknown"]
    rationale: str
    earth_test_method: str | None = None
    required_complement: str | None = None
    evidence_refs: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class RouteResult(BaseModel):
    route_id: str
    geometry: dict[str, Any] | None = None
    distance_m: EvidenceValue
    cost_components: dict[str, EvidenceValue] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    checkpoints: list[dict[str, Any]] = Field(default_factory=list)
    algorithm_version: str
    assumptions: list[str] = Field(default_factory=list)
    not_a_safety_certification: Literal[True] = True


class StudyEnvelope(BaseModel):
    study: Study


class DiscoveryResult(BaseModel):
    study_id: str
    status: Literal["available", "not_configured"]
    candidates: list[Candidate] = Field(default_factory=list)
    message: str
    algorithm_version: str | None = None


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


@contextmanager
def db_session():
    db = connect()
    try:
        with db:
            yield db
    finally:
        db.close()


def init_db() -> None:
    with db_session() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS studies (
            study_id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )""")


def as_study(row: sqlite3.Row) -> Study:
    return Study.model_validate_json(row["payload"])


app = FastAPI(
    title="NEBULITH API",
    version=APP_VERSION,
    description="Local-first planetary research workspace. Missing evidence remains null; outputs are not safety certifications.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("NEBULITH_CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173").split(","),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.middleware("http")
async def attach_request_id(request: Request, call_next):
    request.state.request_id = str(uuid.uuid4())
    response: Response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


@app.exception_handler(HTTPException)
async def structured_http_error(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    detail = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
    payload = ApiError(
        code=detail.get("code", "http_error"),
        message=detail.get("message", "Request failed"),
        details=detail.get("details", {}),
        request_id=request_id,
    )
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=exc.status_code, content={"error": payload.model_dump()})


@app.exception_handler(RequestValidationError)
async def structured_validation_error(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    payload = ApiError(
        code="validation_error",
        message="Request fields did not match the API contract",
        details={"issues": [{"loc": issue.get("loc", []), "msg": issue.get("msg", "Invalid value"), "type": issue.get("type", "value_error")} for issue in exc.errors()]},
        request_id=request_id,
    )
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=422, content={"error": payload.model_dump()})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": APP_VERSION, "storage": "sqlite"}


@app.get("/api/v1/sources")
def list_sources() -> dict[str, Any]:
    # No provider/product has been verified and configured for this workspace yet.
    return {"items": [], "status": "not_configured", "message": "No scientific data products are configured. Visual globe textures are not analysis sources."}


@app.get("/api/v1/targets")
def list_targets(body: Literal["earth", "moon", "mars"] | None = None) -> dict[str, Any]:
    return {"items": [], "body": body, "status": "not_configured", "message": "No verified target AOIs are configured."}


@app.post("/api/v1/studies", response_model=Study, status_code=201)
def create_study(payload: StudyCreate) -> Study:
    now = utc_now()
    study = Study(**payload.model_dump(), study_id=str(uuid.uuid4()), created_at=now, updated_at=now)
    with db_session() as db:
        db.execute("INSERT INTO studies(study_id,payload,created_at,updated_at) VALUES(?,?,?,?)", (study.study_id, study.model_dump_json(), now, now))
    return study


@app.get("/api/v1/studies", response_model=list[Study])
def list_studies() -> list[Study]:
    with db_session() as db:
        rows = db.execute("SELECT * FROM studies ORDER BY updated_at DESC").fetchall()
    return [as_study(row) for row in rows]


@app.get("/api/v1/studies/{study_id}", response_model=Study)
def get_study(study_id: str) -> Study:
    with db_session() as db:
        row = db.execute("SELECT * FROM studies WHERE study_id=?", (study_id,)).fetchone()
    if row is None:
        raise HTTPException(404, {"code": "study_not_found", "message": "Study was not found"})
    return as_study(row)


@app.patch("/api/v1/studies/{study_id}", response_model=Study)
def patch_study(study_id: str, payload: StudyPatch) -> Study:
    current = get_study(study_id)
    data = current.model_dump()
    changes = payload.model_dump(exclude_unset=True)
    for key in ("title", "target_body", "weights", "constraints"):
        if key in changes and changes[key] is None:
            raise HTTPException(422, {"code": "validation_error", "message": f"{key} cannot be null"})
    data.update(changes)
    data["updated_at"] = utc_now()
    updated = Study.model_validate(data)
    with db_session() as db:
        db.execute("UPDATE studies SET payload=?,updated_at=? WHERE study_id=?", (updated.model_dump_json(), updated.updated_at, study_id))
    return updated


@app.delete("/api/v1/studies/{study_id}", status_code=204)
def delete_study(study_id: str) -> Response:
    with db_session() as db:
        cursor = db.execute("DELETE FROM studies WHERE study_id=?", (study_id,))
    if cursor.rowcount == 0:
        raise HTTPException(404, {"code": "study_not_found", "message": "Study was not found"})
    return Response(status_code=204)


@app.post("/api/v1/studies/{study_id}/discover", response_model=DiscoveryResult)
def discover(study_id: str) -> DiscoveryResult:
    get_study(study_id)
    return DiscoveryResult(study_id=study_id, status="not_configured", candidates=[], message="Discovery is unavailable until verified source products and candidate AOIs are configured. No scores were generated.")


@app.get("/api/v1/studies/{study_id}/candidates", response_model=list[Candidate])
def list_candidates(study_id: str) -> list[Candidate]:
    get_study(study_id)
    return []


def unavailable(feature: str) -> None:
    raise HTTPException(409, {"code": "data_not_configured", "message": f"{feature} is unavailable until verified scientific data and a validated method are configured", "details": {"status": "not_configured"}})


@app.post("/api/v1/studies/{study_id}/compare")
def compare(study_id: str) -> None:
    get_study(study_id)
    unavailable("Comparison")


@app.post("/api/v1/studies/{study_id}/transferability")
def transferability(study_id: str) -> None:
    get_study(study_id)
    unavailable("Transferability analysis")


@app.post("/api/v1/studies/{study_id}/routes")
def routes(study_id: str) -> None:
    get_study(study_id)
    unavailable("Route rehearsal")


@app.post("/api/v1/studies/{study_id}/reports")
def create_report(study_id: str) -> dict[str, Any]:
    study = get_study(study_id)
    return {
        "report_id": str(uuid.uuid4()),
        "study_id": study.study_id,
        "generated_at": utc_now(),
        "status": "incomplete",
        "study": study.model_dump(),
        "findings": [],
        "limitations": ["No scientific sources, target AOIs, candidates or analysis products are configured; this snapshot contains no scientific findings."],
        "source_refs": [],
    }


@app.get("/api/v1/exports/{export_id}")
def get_export(export_id: str) -> None:
    raise HTTPException(404, {"code": "export_not_found", "message": "Export was not found"})
