from __future__ import annotations

from pathlib import Path
from typing import Any
import docx
from .pdf import ParsedDocument, ParsedSection
from ...core.logging import logger


def parse_docx(file_path: Path | str) -> ParsedDocument:
    file_path = Path(file_path)
    try:
        doc = docx.Document(str(file_path))
    except Exception as e:
        raise ValueError(f"Corrupted or invalid DOCX file: {str(e)}")

    sections: list[ParsedSection] = []
    
    # Metadata
    props = doc.core_properties
    meta: dict[str, Any] = {
        "title": props.title or file_path.stem.replace("_", " "),
        "authors": [props.author] if props.author else [],
        "created": props.created.isoformat() if props.created else None,
        "format": "docx",
    }

    current_heading = "Document Content"
    current_paragraphs: list[str] = []

    # Iterate paragraphs and headings
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue

        if p.style and p.style.name.startswith("Heading"):
            if current_paragraphs:
                sections.append(
                    ParsedSection(
                        title=current_heading,
                        page_number=1,  # DOCX does not natively store pagination
                        text="\n\n".join(current_paragraphs),
                        section_type="text",
                    )
                )
                current_paragraphs = []
            current_heading = text
        else:
            current_paragraphs.append(text)

    if current_paragraphs:
        sections.append(
            ParsedSection(
                title=current_heading,
                page_number=1,
                text="\n\n".join(current_paragraphs),
                section_type="text",
            )
        )

    # Extract tables as structured markdown
    for i, table in enumerate(doc.tables):
        rows_data = []
        for row in table.rows:
            cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
            rows_data.append(cells)

        if rows_data and len(rows_data) > 1:
            header = rows_data[0]
            separator = ["---"] * len(header)
            md_lines = [
                "| " + " | ".join(header) + " |",
                "| " + " | ".join(separator) + " |",
            ]
            for row in rows_data[1:]:
                # Ensure correct column count
                padded = row + [""] * (len(header) - len(row))
                md_lines.append("| " + " | ".join(padded[: len(header)]) + " |")

            table_text = "\n".join(md_lines)
            sections.append(
                ParsedSection(
                    title=f"Table {i+1}",
                    page_number=1,
                    text=table_text,
                    section_type="table",
                )
            )

    return ParsedDocument(
        sections=sections,
        metadata=meta,
        needs_ocr=False,
        total_pages=1,
    )
