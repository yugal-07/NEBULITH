from __future__ import annotations

import re
import unicodedata


PUNCTUATION_MAP = {
    "\u201c": '"', "\u201d": '"', "\u201e": '"', "\u00ab": '"', "\u00bb": '"',
    "\u2019": "'", "\u2018": "'", "`": "'",
    "\u2014": "-", "\u2013": "-", "\u2212": "-",
    "\u00a0": " ", "\u200b": "", "\u202f": " ",
}


def normalize_scientific_text(text: str, remove_hyphenation: bool = True) -> str:
    """Normalize PDF line breaks and Unicode for conservative quote matching."""
    if not text:
        return ""
    value = unicodedata.normalize("NFKD", text)
    for char, replacement in PUNCTUATION_MAP.items():
        value = value.replace(char, replacement)
    if remove_hyphenation:
        value = re.sub(r"([A-Za-z]+)-\s*\n\s*([A-Za-z]+)", r"\1\2", value)
    value = re.sub(r"\s+", " ", value).strip().casefold()
    return value


def verify_quote_in_text(quote: str, source_text: str) -> bool:
    """Verify a meaningful quote as a substring after typography-only normalization."""
    if not quote or not source_text:
        return False
    normalized_quote = normalize_scientific_text(quote).strip("\"'.,;:-_()[]{}")
    normalized_source = normalize_scientific_text(source_text)
    words = re.findall(r"\b[\w.]+\b", normalized_quote)
    if len(normalized_quote) < 12 or len(words) < 3:
        return False
    return normalized_quote in normalized_source
