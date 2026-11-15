from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from .parsers.pdf import ParsedSection, ParsedDocument


@dataclass
class ChunkData:
    chunk_index: int
    text: str
    token_count: int
    page_number: int | None
    section: str | None
    char_start: int | None
    char_end: int | None
    metadata: dict[str, Any] = field(default_factory=dict)


def estimate_tokens(text: str) -> int:
    """Fast, reliable heuristic: 1 token ~= 4 characters or ~0.75 words."""
    words = len(text.split())
    chars = len(text)
    # Average of character-based and word-based estimation
    return max(1, int((words * 1.3 + chars / 4.0) / 2.0))


def chunk_document(
    parsed_doc: ParsedDocument,
    target_tokens: int = 600,
    overlap_tokens: int = 100,
    max_tokens: int = 800,
) -> list[ChunkData]:
    """
    Chunks a parsed document into segments of ~500-800 tokens with ~100 overlap.
    Preserves table structure (never splits mid-table row) and tracks page and section metadata.
    """
    chunks: list[ChunkData] = []
    chunk_idx = 0
    char_offset_tracker = 0

    for section in parsed_doc.sections:
        section_text = section.text.strip()
        if not section_text:
            continue

        sec_start = char_offset_tracker
        sec_end = sec_start + len(section_text)
        char_offset_tracker = sec_end + 2  # account for spacing

        is_table = section.section_type == "table"
        sec_tokens = estimate_tokens(section_text)

        # Case 1: Section fits comfortably in one chunk
        if sec_tokens <= max_tokens:
            chunks.append(
                ChunkData(
                    chunk_index=chunk_idx,
                    text=section_text,
                    token_count=sec_tokens,
                    page_number=section.page_number,
                    section=section.title,
                    char_start=sec_start,
                    char_end=sec_end,
                    metadata={"section_type": section.section_type},
                )
            )
            chunk_idx += 1
            continue

        # Case 2: Section is a table exceeding max_tokens
        if is_table:
            table_lines = section_text.splitlines()
            if len(table_lines) >= 2:
                header = table_lines[0]
                separator = table_lines[1]
                data_rows = table_lines[2:]
            else:
                header = ""
                separator = ""
                data_rows = table_lines

            current_rows: list[str] = []
            current_tokens = estimate_tokens(header + "\n" + separator) if header else 0
            row_start_char = sec_start

            for row in data_rows:
                row_tokens = estimate_tokens(row)
                if current_tokens + row_tokens > target_tokens and current_rows:
                    # Flush table chunk with header intact
                    chunk_text = f"{header}\n{separator}\n" + "\n".join(current_rows)
                    chunks.append(
                        ChunkData(
                            chunk_index=chunk_idx,
                            text=chunk_text,
                            token_count=estimate_tokens(chunk_text),
                            page_number=section.page_number,
                            section=section.title,
                            char_start=row_start_char,
                            char_end=row_start_char + len(chunk_text),
                            metadata={"section_type": "table", "split": True},
                        )
                    )
                    chunk_idx += 1
                    row_start_char += len(chunk_text)
                    current_rows = []
                    current_tokens = estimate_tokens(header + "\n" + separator) if header else 0

                current_rows.append(row)
                current_tokens += row_tokens

            if current_rows:
                chunk_text = f"{header}\n{separator}\n" + "\n".join(current_rows) if header else "\n".join(current_rows)
                chunks.append(
                    ChunkData(
                        chunk_index=chunk_idx,
                        text=chunk_text,
                        token_count=estimate_tokens(chunk_text),
                        page_number=section.page_number,
                        section=section.title,
                        char_start=row_start_char,
                        char_end=sec_end,
                        metadata={"section_type": "table", "split": True},
                    )
                )
                chunk_idx += 1
            continue

        # Case 3: Regular text section exceeding max_tokens -> split by paragraphs/sentences
        paragraphs = [p.strip() for p in section_text.split("\n\n") if p.strip()]
        current_paragraphs: list[str] = []
        current_tokens = 0
        p_start_offset = sec_start

        for para in paragraphs:
            para_tokens = estimate_tokens(para)
            if current_tokens + para_tokens > target_tokens and current_paragraphs:
                chunk_text = "\n\n".join(current_paragraphs)
                chunks.append(
                    ChunkData(
                        chunk_index=chunk_idx,
                        text=chunk_text,
                        token_count=estimate_tokens(chunk_text),
                        page_number=section.page_number,
                        section=section.title,
                        char_start=p_start_offset,
                        char_end=p_start_offset + len(chunk_text),
                        metadata={"section_type": "text"},
                    )
                )
                chunk_idx += 1

                # Overlap: keep the last paragraph if under overlap_tokens
                if estimate_tokens(current_paragraphs[-1]) <= overlap_tokens * 1.5:
                    overlap_para = current_paragraphs[-1]
                    p_start_offset = p_start_offset + len(chunk_text) - len(overlap_para)
                    current_paragraphs = [overlap_para]
                    current_tokens = estimate_tokens(overlap_para)
                else:
                    p_start_offset = p_start_offset + len(chunk_text)
                    current_paragraphs = []
                    current_tokens = 0

            current_paragraphs.append(para)
            current_tokens += para_tokens

        if current_paragraphs:
            chunk_text = "\n\n".join(current_paragraphs)
            chunks.append(
                ChunkData(
                    chunk_index=chunk_idx,
                    text=chunk_text,
                    token_count=estimate_tokens(chunk_text),
                    page_number=section.page_number,
                    section=section.title,
                    char_start=p_start_offset,
                    char_end=sec_end,
                    metadata={"section_type": "text"},
                )
            )
            chunk_idx += 1

    return chunks
