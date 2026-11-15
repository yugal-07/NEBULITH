from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.errors import BadRequestError, NotFoundError
from ...models import Document, ExtractedParameter
from ...extraction.extractor import extract_parameters_for_documents
from ...extraction.schemas import ExtractionResultResponse, ExtractedParameterResponse

router = APIRouter(tags=["Extraction"])


class AnalysisExtractRequest(BaseModel):
    document_ids: list[str] = Field(..., min_length=1, description="List of document IDs to extract parameters from")


@router.post("/documents/{document_id}/extract", response_model=ExtractionResultResponse)
def extract_document_parameters(document_id: str, db: Session = Depends(get_db)) -> ExtractionResultResponse:
    """
    Extract target environment scientific parameters from a single document.
    Performs quote verification, unit normalization via pint, and explicit missing data tracking.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise NotFoundError(f"Document with ID '{document_id}' not found.")

    return extract_parameters_for_documents(db=db, document_ids=[document_id])


@router.post("/analysis/extract", response_model=ExtractionResultResponse)
def extract_analysis_parameters(payload: AnalysisExtractRequest, db: Session = Depends(get_db)) -> ExtractionResultResponse:
    """
    Extract and synthesize target environment parameters across a set of documents.
    Tracks disagreements and flags conflicts when sources disagree.
    """
    if not payload.document_ids:
        raise BadRequestError("document_ids must contain at least one document ID.")

    # Validate that documents exist
    existing_count = db.query(Document).filter(Document.id.in_(payload.document_ids)).count()
    if existing_count == 0:
        raise NotFoundError("None of the specified document IDs were found.")

    return extract_parameters_for_documents(db=db, document_ids=payload.document_ids)


@router.get("/documents/{document_id}/parameters", response_model=list[ExtractedParameterResponse])
def get_document_parameters(document_id: str, db: Session = Depends(get_db)) -> list[ExtractedParameterResponse]:
    """Retrieve all stored extracted parameters for a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise NotFoundError(f"Document with ID '{document_id}' not found.")

    records = db.query(ExtractedParameter).filter(ExtractedParameter.document_id == document_id).all()
    results = []
    for r in records:
        results.append(
            ExtractedParameterResponse(
                id=r.id,
                parameter_name=r.parameter_name,
                raw_value=r.raw_value,
                unit=r.unit,
                normalized_value=r.normalized_value,
                normalized_unit=r.normalized_unit,
                conversion_failed=r.conversion_failed,
                conversion_error=r.conversion_error,
                document_id=r.document_id,
                chunk_id=r.chunk_id,
                page_number=r.page_number,
                verbatim_quote=r.verbatim_quote,
                confidence=r.confidence,
                extraction_method=r.extraction_method,
                is_missing=False,
                is_conflict=r.is_conflict,
                conflict_details=r.conflict_details,
            )
        )
    return results
