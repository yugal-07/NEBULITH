from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
import fitz  # PyMuPDF
from ...core.logging import logger


@dataclass
class ParsedSection:
    title: str
    page_number: int
    text: str
    section_type: str = "text"  # "text", "table", "header"


@dataclass
class ParsedDocument:
    sections: list[ParsedSection] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    needs_ocr: bool = False
    total_pages: int = 0


DOI_REGEX = re.compile(r"10\.\d{4,9}/[-._;()/:A-Za-z0-9]+", re.IGNORECASE)

COMMON_SCIENTIFIC_HEADINGS = [
    "abstract",
    "introduction",
    "background",
    "geological setting",
    "environmental setting",
    "regional setting",
    "study area",
    "data and methods",
    "materials and methods",
    "methods",
    "methodology",
    "observations",
    "field observations",
    "lithology and mineralogy",
    "mineralogy and geochemistry",
    "mineralogy",
    "geochemistry",
    "results and discussion",
    "results",
    "discussion",
    "conclusions",
    "conclusion",
    "summary",
    "references",
    "acknowledgments",
]


def detect_section_heading(text: str) -> tuple[str | None, str]:
    """
    Detects if the text block or its first line is a scientific section heading.
    Returns (detected_heading, remaining_text).
    """
    first_line = text.split("\n")[0].strip()
    clean_line = first_line.rstrip(":").strip()
    lower_line = clean_line.lower()

    # 1. Standalone common headings
    for h in COMMON_SCIENTIFIC_HEADINGS:
        if lower_line == h or (lower_line.startswith(h) and len(clean_line) < 50):
            remaining = "\n".join(text.split("\n")[1:]).strip()
            return clean_line.title() if clean_line.isupper() else clean_line, remaining

    # 2. Numbered headings (e.g. '1. Introduction', '2. Geological Setting', '3.1 Methods')
    m_num = re.match(r"^([0-9]+(\.[0-9]+)*\.?\s+[A-Za-z][A-Za-z0-9\s,\-–:]{2,60})$", first_line)
    if m_num:
        remaining = "\n".join(text.split("\n")[1:]).strip()
        return m_num.group(1).strip(), remaining

    # 3. Colon prefix headings on first line (e.g. 'Data and Methods:  The analysis of gullies...')
    m_col = re.match(
        r"^(Abstract|Introduction|Data and Methods|Materials and Methods|Methods|Methodology|Results|Discussion|Conclusions?|Observations|Geological Setting|Study Area)\s*:\s*(.*)",
        first_line,
        re.IGNORECASE,
    )
    if m_col:
        heading = m_col.group(1).strip()
        first_line_rest = m_col.group(2).strip()
        rest_lines = text.split("\n")[1:]
        remaining_parts = ([first_line_rest] if first_line_rest else []) + rest_lines
        return heading, "\n".join(remaining_parts).strip()

    return None, text


def extract_column_ordered_blocks(page: fitz.Page) -> list[tuple[float, float, float, float, str]]:
    """
    Extracts text blocks in correct reading order for two-column or single-column layouts.
    Prevents text interleaving between left and right columns.
    """
    raw_blocks = page.get_text("blocks")
    text_blocks = []

    for b in raw_blocks:
        # b = (x0, y0, x1, y1, text, block_no, block_type)
        if len(b) >= 7 and b[6] == 0:  # text block
            text = b[4].strip()
            if text:
                text_blocks.append((b[0], b[1], b[2], b[3], text))

    if not text_blocks:
        return []

    page_width = page.rect.width
    midpoint = page_width / 2.0

    # Determine if page contains multi-column blocks
    left_blocks = [b for b in text_blocks if b[2] <= midpoint * 1.15]
    right_blocks = [b for b in text_blocks if b[0] >= midpoint * 0.85]
    full_width_blocks = [b for b in text_blocks if b not in left_blocks and b not in right_blocks]

    # If substantial blocks are on both left and right, order column-wise
    if len(left_blocks) >= 2 and len(right_blocks) >= 2:
        top_full = sorted([b for b in full_width_blocks if b[1] < page.rect.height * 0.3], key=lambda b: b[1])
        bottom_full = sorted([b for b in full_width_blocks if b[1] >= page.rect.height * 0.3], key=lambda b: b[1])

        sorted_left = sorted(left_blocks, key=lambda b: (round(b[1], 1), b[0]))
        sorted_right = sorted(right_blocks, key=lambda b: (round(b[1], 1), b[0]))

        return top_full + sorted_left + sorted_right + bottom_full

    return sorted(text_blocks, key=lambda b: (round(b[1] / 10.0) * 10, b[0]))


def parse_pdf(file_path: Path | str) -> ParsedDocument:
    """
    Parses a PDF document with PyMuPDF.
    Detects scanned PDFs, handles tables, two-column layouts, real section headings, and metadata.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    try:
        doc = fitz.open(str(file_path))
    except Exception as e:
        raise ValueError(f"Corrupted or invalid PDF file: {str(e)}")

    if doc.is_encrypted:
        doc.close()
        raise ValueError("Password-protected or encrypted PDF cannot be parsed without credentials.")

    total_pages = len(doc)
    sections: list[ParsedSection] = []
    total_chars = 0
    all_text_blobs = []

    # Metadata extraction
    doc_meta = doc.metadata or {}
    meta: dict[str, Any] = {
        "title": doc_meta.get("title") or file_path.stem.replace("_", " "),
        "authors": [doc_meta.get("author")] if doc_meta.get("author") else [],
        "subject": doc_meta.get("subject"),
        "creator": doc_meta.get("creator"),
        "total_pages": total_pages,
    }

    current_heading = "Overview"
    current_paragraphs: list[str] = []
    current_page = 1

    for page_idx in range(total_pages):
        page = doc[page_idx]
        page_num = page_idx + 1

        # 1. Extract tables if available
        try:
            tab_finder = page.find_tables()
            if tab_finder and tab_finder.tables:
                for t_idx, tab in enumerate(tab_finder.tables):
                    df = tab.to_pandas()
                    if df is not None and not df.empty:
                        md_table = df.to_markdown(index=False)
                        sections.append(
                            ParsedSection(
                                title=f"Table {t_idx+1}: {current_heading}",
                                page_number=page_num,
                                text=md_table,
                                section_type="table",
                            )
                        )
        except Exception as e:
            logger.debug(f"PyMuPDF table extraction note on page {page_num}: {e}")

        # 2. Extract column-ordered text blocks
        blocks = extract_column_ordered_blocks(page)

        for b in blocks:
            text = b[4].strip()
            total_chars += len(text)
            all_text_blobs.append(text)

            detected_heading, remaining_text = detect_section_heading(text)
            if detected_heading:
                # Flush existing content under previous heading
                if current_paragraphs:
                    sections.append(
                        ParsedSection(
                            title=current_heading,
                            page_number=current_page,
                            text="\n\n".join(current_paragraphs),
                            section_type="text",
                        )
                    )
                    current_paragraphs = []

                current_heading = detected_heading
                current_page = page_num
                if remaining_text:
                    current_paragraphs.append(remaining_text)
            else:
                current_paragraphs.append(text)
                current_page = page_num

    # Flush final accumulated paragraphs
    if current_paragraphs:
        sections.append(
            ParsedSection(
                title=current_heading,
                page_number=current_page,
                text="\n\n".join(current_paragraphs),
                section_type="text",
            )
        )

    doc.close()

    # Search for DOI in extracted text
    combined_sample = " ".join(all_text_blobs[:10])
    doi_match = DOI_REGEX.search(combined_sample)
    if doi_match:
        meta["doi"] = doi_match.group(0)

    # Scanned PDF check
    avg_chars_per_page = total_chars / max(total_pages, 1)
    needs_ocr = avg_chars_per_page < 40 or total_chars < 50

    if needs_ocr:
        logger.warning(
            f"PDF {file_path.name} has insufficient text layer ({total_chars} chars across {total_pages} pages). Marked needs_ocr."
        )

    return ParsedDocument(
        sections=sections,
        metadata=meta,
        needs_ocr=needs_ocr,
        total_pages=total_pages,
    )
