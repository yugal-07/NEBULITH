from __future__ import annotations

import re
from pathlib import Path
from typing import Any
import pandas as pd
from .pdf import ParsedDocument, ParsedSection
from ...core.logging import logger

LAT_NAMES = {"latitude", "lat", "y", "geo_lat", "dec_lat", "latitude_deg"}
LON_NAMES = {"longitude", "lon", "lng", "long", "x", "geo_lon", "dec_lon", "longitude_deg"}
UNIT_REGEX = re.compile(r"[\(\[\{]([A-Za-z0-9°/%\^_\-]+)[\)\]\}]")


def detect_tabular_schema(df: pd.DataFrame) -> dict[str, Any]:
    """Inspects DataFrame columns, data types, coordinate fields, and units."""
    columns = list(df.columns)
    coord_fields: dict[str, str | None] = {"latitude": None, "longitude": None}
    column_units: dict[str, str | None] = {}
    col_summaries: dict[str, Any] = {}

    for col in columns:
        col_str = str(col).strip()
        lower_col = col_str.lower().replace(" ", "_")

        # Coordinate detection
        if any(lower_col == alias or lower_col.startswith(f"{alias}_") for alias in LAT_NAMES):
            coord_fields["latitude"] = col_str
        elif any(lower_col == alias or lower_col.startswith(f"{alias}_") for alias in LON_NAMES):
            coord_fields["longitude"] = col_str

        # Unit detection
        unit_match = UNIT_REGEX.search(col_str)
        if unit_match:
            column_units[col_str] = unit_match.group(1)
        elif lower_col.endswith("_k") or lower_col.endswith("_kelvin"):
            column_units[col_str] = "K"
        elif lower_col.endswith("_c") or lower_col.endswith("_degc"):
            column_units[col_str] = "degC"
        elif lower_col.endswith("_pa") or lower_col.endswith("_mbar"):
            column_units[col_str] = "Pa" if "pa" in lower_col else "mbar"
        elif lower_col.endswith("_m") or lower_col.endswith("_meter"):
            column_units[col_str] = "m"
        elif lower_col.endswith("_mm"):
            column_units[col_str] = "mm"
        else:
            column_units[col_str] = None

        col_summaries[col_str] = {
            "dtype": str(df[col].dtype),
            "non_null_count": int(df[col].count()),
            "unit": column_units[col_str],
        }

    return {
        "total_rows": len(df),
        "total_columns": len(columns),
        "columns": columns,
        "coordinate_fields": coord_fields,
        "column_units": column_units,
        "column_summaries": col_summaries,
    }


def parse_tabular(file_path: Path | str, file_type: str = "csv") -> ParsedDocument:
    file_path = Path(file_path)
    try:
        if file_type.lower() == "csv":
            # Attempt UTF-8, then Latin-1
            try:
                df = pd.read_csv(file_path, encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, encoding="latin-1")
        elif file_type.lower() == "xlsx":
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported tabular format: {file_type}")
    except Exception as e:
        raise ValueError(f"Corrupted or unreadable tabular file {file_path.name}: {str(e)}")

    schema_summary = detect_tabular_schema(df)
    
    meta = {
        "title": file_path.stem.replace("_", " "),
        "format": file_type.lower(),
        "schema_summary": schema_summary,
        "has_coordinates": bool(schema_summary["coordinate_fields"]["latitude"] and schema_summary["coordinate_fields"]["longitude"]),
    }

    # Group rows into manageable structured table chunks (15 rows per group)
    # Keeping the header in every group ensures no row split mid-table
    sections: list[ParsedSection] = []
    rows_per_group = 15
    total_rows = len(df)

    if total_rows == 0:
        sections.append(
            ParsedSection(
                title="Empty Table",
                page_number=1,
                text=f"Columns: {', '.join(map(str, df.columns))}\n(No rows)",
                section_type="table",
            )
        )
    else:
        for start_idx in range(0, total_rows, rows_per_group):
            end_idx = min(start_idx + rows_per_group, total_rows)
            chunk_df = df.iloc[start_idx:end_idx]
            
            # Format as markdown table
            md_table = chunk_df.to_markdown(index=False)
            sections.append(
                ParsedSection(
                    title=f"Rows {start_idx+1}-{end_idx} of {total_rows}",
                    page_number=1 + (start_idx // (rows_per_group * 4)),  # Synthetic page
                    text=md_table,
                    section_type="table",
                )
            )

    return ParsedDocument(
        sections=sections,
        metadata=meta,
        needs_ocr=False,
        total_pages=max(1, (total_rows + rows_per_group - 1) // rows_per_group),
    )
