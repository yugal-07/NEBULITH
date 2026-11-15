from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
import fitz  # PyMuPDF
from ...core.logging import logger


@dataclass
class ParsedSection:
    title: str | None
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
        # Sort full-width header/title blocks at top first
        top_full = sorted([b for b in full_width_blocks if b[1] < page.rect.height * 0.3], key=lambda b: b[1])
        bottom_full = sorted([b for b in full_width_blocks if b[1] >= page.rect.height * 0.3], key=lambda b: b[1])

        # Sort left column top-to-bottom
        sorted_left = sorted(left_blocks, key=lambda b: (round(b[1], 1), b[0]))
        # Sort right column top-to-bottom
        sorted_right = sorted(right_blocks, key=lambda b: (round(b[1], 1), b[0]))

        return top_full + sorted_left + sorted_right + bottom_full

    # Otherwise standard top-to-bottom reading order
    return sorted(text_blocks, key=lambda b: (round(b[1] / 10.0) * 10, b[0]))


def parse_pdf(file_path: Path | str) -> ParsedDocument:
    """
    Parses a PDF document with PyMuPDF.
    Detects scanned PDFs, handles tables, two-column layouts, and extracts metadata.
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

    # Metadata extraction from doc properties
    doc_meta = doc.metadata or {}
    meta: dict[str, Any] = {
        "title": doc_meta.get("title") or file_path.stem.replace("_", " "),
        "authors": [doc_meta.get("author")] if doc_meta.get("author") else [],
        "subject": doc_meta.get("subject"),
        "creator": doc_meta.get("creator"),
        "total_pages": total_pages,
    }

    # Heading detection pattern
    heading_pattern = re.compile(r"^([0-9]+\.?\s+[A-Z][A-Za-z0-9\s]{2,40}|[A-Z\s]{4,40})$")

    for page_idx in range(total_pages):
        page = doc[page_idx]
        page_num = page_idx + 1

        # 1. Extract tables if available
        tables = []
        try:
            tab_finder = page.find_tables()
            if tab_finder and tab_finder.tables:
                for tab in tab_finder.tables:
                    df = tab.to_pandas()
                    if df is not None and not df.empty:
                        # Format as markdown table
                        md_table = df.to_markdown(index=False)
                        tables.append(md_table)
                        sections.append(
                            ParsedSection(
                                title=f"Table (Page {page_num})",
                                page_number=page_num,
                                text=md_table,
                                section_type="table",
                            )
                        )
        except Exception as e:
            logger.debug(f"PyMuPDF table extraction note on page {page_num}: {e}")

        # 2. Extract column-ordered text blocks
        blocks = extract_column_ordered_blocks(page)
        current_heading = f"Page {page_num}"
        current_paragraphs: list[str] = []

        for b in blocks:
            text = b[4].strip()
            total_chars += len(text)
            all_text_blobs.append(text)

            # Detect section heading
            first_line = text.split("\n")[0].strip()
            if heading_pattern.match(first_line) and len(first_line) < 60:
                # Flush previous paragraph
                if current_paragraphs:
                    sections.append(
                        ParsedSection(
                            title=current_heading,
                            page_number=page_num,
                            text="\n\n".join(current_paragraphs),
                            section_type="text",
                        )
                    )
                    current_paragraphs = []
                current_heading = first_line
                remaining = "\n".join(text.split("\n")[1:]).strip()
                if remaining:
                    current_paragraphs.append(remaining)
            else:
                current_paragraphs.append(text)

        if current_paragraphs:
            sections.append(
                ParsedSection(
                    title=current_heading,
                    page_number=page_num,
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

    # Scanned PDF check: if less than 50 chars per page on average, mark as needs_ocr
    avg_chars_per_page = total_chars / max(total_pages, 1)
    needs_ocr = avg_chars_per_page < 40 or total_chars < 50

    if needs_ocr:
        logger.warning(f"PDF {file_path.name} has insufficient text layer ({total_chars} chars across {total_pages} pages). Marked needs_ocr.")

    return ParsedDocument(
        sections=sections,
        metadata=meta,
        needs_ocr=needs_ocr,
        total_pages=total_pages,
    )
