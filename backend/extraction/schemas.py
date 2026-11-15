from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

TARGET_ENVIRONMENT_PARAMETERS = [
    "target_body",
    "mean_temperature",
    "temperature_range",
    "atmospheric_pressure",
    "annual_precipitation",
    "aridity",
    "elevation_range",
    "lithology",
    "mineralogy",
    "salinity",
    "ph",
    "water_availability",
    "uv_exposure",
    "terrain_morphology",
]


class RawExtractedItem(BaseModel):
    parameter_name: str
    value: Any = None
    unit: str | None = None
    chunk_id: str | None = None
    page_number: int | None = None
    verbatim_quote: str | None = None
    confidence: float = 1.0
    extraction_method: str = "llm_grounded"


class TargetEnvironmentExtractionPayload(BaseModel):
    parameters: list[RawExtractedItem] = Field(default_factory=list)


class ExtractedParameterResponse(BaseModel):
    id: str | None = None
    parameter_name: str
    raw_value: Any = None
    unit: str | None = None
    normalized_value: Any = None
    normalized_unit: str | None = None
    conversion_failed: bool = False
    conversion_error: str | None = None
    document_id: str
    chunk_id: str | None = None
    page_number: int | None = None
    verbatim_quote: str | None = None
    confidence: float = 1.0
    extraction_method: str = "llm_grounded"
    is_missing: bool = False
    is_conflict: bool = False
    conflict_details: dict[str, Any] | None = None


class ExtractionResultResponse(BaseModel):
    document_ids: list[str]
    total_parameters_evaluated: int
    found_parameters_count: int
    missing_parameters_count: int
    conflict_count: int
    parameters: list[ExtractedParameterResponse]
