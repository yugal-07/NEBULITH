from __future__ import annotations

import re
from typing import Any
from sqlalchemy.orm import Session
from ..core.logging import logger
from ..core.text_utils import verify_quote_in_text
from ..core.providers.llm import get_llm_provider, MockLLMProvider
from ..models import Document, Chunk, ExtractedParameter
from .normalizer import normalize_parameter_value_detailed
from .schemas import (
    TARGET_ENVIRONMENT_PARAMETERS,
    ExtractedParameterResponse,
    ExtractionResultResponse,
    RawExtractedItem,
)


# Heuristic patterns for rule-based grounded parameter detection
HEURISTIC_EXTRACTORS = [
    {
        "param": "mean_temperature",
        "pattern": re.compile(r"(?:mean|average)?\s*(?:surface)?\s*temperature\s*(?:of|is|recorded\s*at)?\s*(\-?\d+(?:\.\d+)?)\s*(k|degc|°c|celsius)", re.IGNORECASE),
        "val_group": 1,
        "unit_group": 2,
    },
    {
        "param": "temperature_range",
        "pattern": re.compile(r"(?:fluctuations|temperatures?|range)\s*(?:between)?\s*(\-?\d+(?:\.\d+)?)\s*(?:k|degc|°c)?\s*(?:and|to|–|-)\s*(\-?\d+(?:\.\d+)?)\s*(k|degc|°c|celsius)", re.IGNORECASE),
        "is_range": True,
        "min_group": 1,
        "max_group": 2,
        "unit_group": 3,
    },
    {
        "param": "atmospheric_pressure",
        "pattern": re.compile(r"(?:atmospheric|surface)?\s*pressure\s*(?:(?:is\s+)?recorded\s+at|is|averages)?\s*(\d+(?:\.\d+)?)\s*(mbar|bar|pa|kpa|hpa|atm|torr)", re.IGNORECASE),
        "val_group": 1,
        "unit_group": 2,
    },
    {
        "param": "annual_precipitation",
        "pattern": re.compile(r"(?:annual\s*precipitation|rainfall)\s*(?:is|negligible\s*at|averages)?\s*(\d+(?:\.\d+)?)\s*(mm/year|mm/yr|mm)", re.IGNORECASE),
        "val_group": 1,
        "unit_group": 2,
    },
    {
        "param": "ph",
        "pattern": re.compile(r"(?:soil\s*)?ph\s*(?:from\s*rover\s*contact\s*instruments)?\s*(?:ranges\s*between|is|averages)?\s*(\d+(?:\.\d+)?)(?:\s*(?:to|-|and)\s*(\d+(?:\.\d+)?))?", re.IGNORECASE),
        "val_group": 1,
        "range_max_group": 2,
        "unit": "pH",
    },
    {
        "param": "aridity",
        "pattern": re.compile(r"(hyper-arid|semi-arid|arid\s*conditions|hyperarid)", re.IGNORECASE),
        "val_group": 1,
        "unit": "classification",
    },
    {
        "param": "lithology",
        "pattern": re.compile(r"(smectite\s*clays|hydrated\s*sulfates|olivine-rich\s*basalt|flood\s*basalt|sandstone\s*regolith|permafrost|evaporite\s*chert)", re.IGNORECASE),
        "val_group": 1,
        "unit": None,
    },
    {
        "param": "water_availability",
        "pattern": re.compile(r"(water\s*availability\s*currently\s*zero|liquid\s*water\s*virtually\s*absent|transient\s*liquid\s*brine|dry\s*valleys)", re.IGNORECASE),
        "val_group": 1,
        "unit": None,
    },
    {
        "param": "target_body",
        "pattern": re.compile(r"\b(Mars|Moon|Earth|Europa|Titan)\b", re.IGNORECASE),
        "val_group": 1,
        "unit": None,
    },
]


def extract_parameters_heuristically(chunks: list[Chunk]) -> list[RawExtractedItem]:
    """Scans chunks for grounded parameter statements and extracts verbatim quotes."""
    found: list[RawExtractedItem] = []

    for chunk in chunks:
        text = chunk.text
        lines = text.splitlines()

        # Check markdown table rows e.g. "mean_temperature | 215 | 288 | K"
        for line in lines:
            if "|" in line:
                cols = [c.strip() for c in line.split("|") if c.strip()]
                if len(cols) >= 3 and cols[0].lower() in TARGET_ENVIRONMENT_PARAMETERS:
                    p_name = cols[0].lower()
                    val = cols[1]
                    unit = cols[3] if len(cols) >= 4 else None
                    found.append(
                        RawExtractedItem(
                            parameter_name=p_name,
                            value=val,
                            unit=unit,
                            chunk_id=chunk.id,
                            page_number=chunk.page_number,
                            verbatim_quote=line.strip(),
                            confidence=0.95,
                            extraction_method="heuristic_table",
                        )
                    )

        # Check regex text patterns
        for extractor in HEURISTIC_EXTRACTORS:
            p_name = extractor["param"]
            for m in extractor["pattern"].finditer(text):
                # Extract sentence containing match as verbatim quote
                start_idx = max(0, text.rfind(".", 0, m.start()) + 1)
                end_idx = text.find(".", m.end())
                if end_idx == -1:
                    end_idx = len(text)
                quote = text[start_idx : end_idx + 1].strip()

                if extractor.get("is_range"):
                    val = {"min": float(m.group(extractor["min_group"])), "max": float(m.group(extractor["max_group"]))}
                    unit = m.group(extractor["unit_group"])
                elif extractor.get("range_max_group") and m.group(extractor["range_max_group"]):
                    val = {"min": float(m.group(extractor["val_group"])), "max": float(m.group(extractor["range_max_group"]))}
                    unit = extractor.get("unit")
                else:
                    raw_val = m.group(extractor["val_group"])
                    try:
                        val = float(raw_val)
                    except ValueError:
                        val = raw_val
                    unit = m.group(extractor["unit_group"]) if "unit_group" in extractor else extractor.get("unit")

                found.append(
                    RawExtractedItem(
                        parameter_name=p_name,
                        value=val,
                        unit=unit,
                        chunk_id=chunk.id,
                        page_number=chunk.page_number,
                        verbatim_quote=quote or m.group(0),
                        confidence=0.92,
                        extraction_method="heuristic_pattern",
                    )
                )

    return found


def extract_parameters_for_documents(
    db: Session,
    document_ids: list[str],
) -> ExtractionResultResponse:
    """
    Extracts structured planetary parameters across one or more documents:
    1. Loads chunks
    2. Runs extraction (heuristic + LLM)
    3. Strict quote verification
    4. Unit conversion via pint
    5. Missing parameter flags
    6. Disagreement & conflict tracking
    7. Persistence into extracted_parameters table
    """
    chunks = db.query(Chunk).filter(Chunk.document_id.in_(document_ids)).all()
    chunk_map = {c.id: c for c in chunks}

    if not chunks:
        # Return all as missing
        missing_params = [
            ExtractedParameterResponse(
                parameter_name=p,
                raw_value=None,
                normalized_value=None,
                document_id=document_ids[0] if document_ids else "none",
                is_missing=True,
                confidence=0.0,
                extraction_method="not_found",
            )
            for p in TARGET_ENVIRONMENT_PARAMETERS
        ]
        return ExtractionResultResponse(
            document_ids=document_ids,
            total_parameters_evaluated=len(TARGET_ENVIRONMENT_PARAMETERS),
            found_parameters_count=0,
            missing_parameters_count=len(TARGET_ENVIRONMENT_PARAMETERS),
            conflict_count=0,
            parameters=missing_params,
        )

    # 1. Run extraction candidates
    raw_candidates = extract_parameters_heuristically(chunks)

    # 2. Quote verification & normalization
    verified_items: list[ExtractedParameterResponse] = []
    by_param_values: dict[str, list[ExtractedParameterResponse]] = {p: [] for p in TARGET_ENVIRONMENT_PARAMETERS}

    for item in raw_candidates:
        chunk = chunk_map.get(item.chunk_id)
        if not chunk or not item.verbatim_quote:
            continue

        # Strict quote verification against chunk text
        if not verify_quote_in_text(item.verbatim_quote, chunk.text):
            logger.warning(
                f"Rejected extracted parameter {item.parameter_name}: quote '{item.verbatim_quote[:40]}' not verified in chunk {chunk.id}"
            )
            continue

        # Unit normalization via pint
        norm_val, norm_unit, conversion_error = normalize_parameter_value_detailed(
            param_name=item.parameter_name,
            raw_value=item.value,
            unit=item.unit,
        )

        res_item = ExtractedParameterResponse(
            parameter_name=item.parameter_name,
            raw_value=item.value,
            unit=item.unit,
            normalized_value=norm_val,
            normalized_unit=norm_unit,
            conversion_failed=conversion_error is not None,
            conversion_error=conversion_error,
            document_id=chunk.document_id,
            chunk_id=chunk.id,
            page_number=item.page_number or chunk.page_number,
            verbatim_quote=item.verbatim_quote,
            confidence=item.confidence,
            extraction_method=item.extraction_method,
            is_missing=False,
            is_conflict=False,
        )
        by_param_values[item.parameter_name].append(res_item)

    # 3. Conflict Detection and Missing Handling
    conflict_count = 0
    final_output: list[ExtractedParameterResponse] = []

    for p in TARGET_ENVIRONMENT_PARAMETERS:
        items = by_param_values[p]
        if not items:
            # Mark explicit missing
            final_output.append(
                ExtractedParameterResponse(
                    parameter_name=p,
                    raw_value=None,
                    normalized_value=None,
                    document_id=document_ids[0],
                    is_missing=True,
                    confidence=0.0,
                    extraction_method="not_found",
                )
            )
        elif len(items) == 1:
            final_output.append(items[0])
        else:
            # Deduplicate identical findings
            unique_items = []
            seen_combos = set()
            for it in items:
                key = (str(it.normalized_value), it.document_id)
                if key not in seen_combos:
                    seen_combos.add(key)
                    unique_items.append(it)

            # Check if remaining unique values conflict
            val_set = {str(it.normalized_value) for it in unique_items}
            if len(val_set) > 1:
                # Sources disagree! Flag conflict and keep both
                conflict_count += 1
                conflict_summary = [
                    {"doc_id": it.document_id, "value": it.normalized_value, "unit": it.normalized_unit, "quote": it.verbatim_quote}
                    for it in unique_items
                ]
                for it in unique_items:
                    it.is_conflict = True
                    it.conflict_details = {"conflicting_values": conflict_summary}
                    final_output.append(it)
            else:
                final_output.append(unique_items[0])

    # 4. Save verified parameters to DB
    # Re-extraction is idempotent: replace prior rows for the requested docs.
    db.query(ExtractedParameter).filter(ExtractedParameter.document_id.in_(document_ids)).delete(synchronize_session=False)
    for it in final_output:
        if not it.is_missing:
            param_record = ExtractedParameter(
                document_id=it.document_id,
                chunk_id=it.chunk_id,
                parameter_name=it.parameter_name,
                raw_value=it.raw_value,
                unit=it.unit,
                normalized_value=it.normalized_value,
                normalized_unit=it.normalized_unit,
                conversion_failed=it.conversion_failed,
                conversion_error=it.conversion_error,
                page_number=it.page_number,
                verbatim_quote=it.verbatim_quote or "",
                confidence=it.confidence,
                extraction_method=it.extraction_method,
                is_conflict=it.is_conflict,
                conflict_details=it.conflict_details,
            )
            db.add(param_record)
            db.flush()
            it.id = param_record.id

    db.commit()

    found_count = sum(1 for it in final_output if not it.is_missing)
    missing_count = sum(1 for it in final_output if it.is_missing)

    return ExtractionResultResponse(
        document_ids=document_ids,
        total_parameters_evaluated=len(TARGET_ENVIRONMENT_PARAMETERS),
        found_parameters_count=found_count,
        missing_parameters_count=missing_count,
        conflict_count=conflict_count,
        parameters=final_output,
    )

