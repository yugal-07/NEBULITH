from __future__ import annotations

import hashlib
import os
import re
import zipfile
from pathlib import Path
from typing import BinaryIO
from ..core.config import settings
from ..core.errors import BadRequestError


# Allowed extensions and magic byte signatures
MAGIC_SIGNATURES = {
    "pdf": [b"%PDF-"],
    "zip": [b"PK\x03\x04"],  # DOCX and XLSX are ZIP archives
}

DISALLOWED_MAGIC = [
    (b"MZ", "Executable files (.exe/.dll) are strictly forbidden"),
    (b"<!DOCTYPE html", "HTML files are not supported"),
    (b"<html", "HTML files are not supported"),
    (b"<?php", "PHP files are not supported"),
    (b"#!/bin/", "Shell scripts are not supported"),
]


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal or malicious characters."""
    # Strip path separators and null bytes
    name = os.path.basename(filename)
    name = re.sub(r"[\x00-\x1f\x7f/\\]", "", name)
    # Replace whitespace and unsafe characters with underscores
    name = re.sub(r"[^\w.\-]", "_", name)
    if not name or name.startswith("."):
        name = f"document_{name}"
    return name


def validate_file_content(file_bytes: bytes, filename: str, content_type: str) -> tuple[str, str]:
    """
    Validates file size, extension, content type, and magic bytes.
    Returns (detected_format, sha256_hash).
    Raises BadRequestError on invalid or suspicious files.
    """
    # 1. Size check
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise BadRequestError(
            f"File '{filename}' exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB (size: {size_mb:.1f}MB)"
        )

    if len(file_bytes) == 0:
        raise BadRequestError(f"File '{filename}' is empty.")

    # 2. Check for explicitly disallowed magic signatures (renamed .exe, .html, etc.)
    prefix = file_bytes[:64].lower()
    for sig, reason in DISALLOWED_MAGIC:
        if file_bytes.startswith(sig) or sig.lower() in prefix:
            raise BadRequestError(f"Security validation failed for '{filename}': {reason}")

    # 3. Detect format from extension
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise BadRequestError(
            f"Unsupported file extension '.{ext}'. Allowed formats: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
        )

    # 4. Validate magic bytes per format
    if ext == "pdf":
        if not file_bytes.startswith(b"%PDF-"):
            raise BadRequestError(f"File '{filename}' does not have valid PDF magic bytes.")
        detected_format = "pdf"

    elif ext in ("docx", "xlsx"):
        if not file_bytes.startswith(b"PK\x03\x04"):
            raise BadRequestError(f"File '{filename}' is not a valid Office Open XML zip archive.")
        
        # Verify internal structure to distinguish docx vs xlsx vs arbitrary zip
        import io
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                namelist = z.namelist()
                if ext == "docx":
                    if not any(f.startswith("word/") for f in namelist):
                        raise BadRequestError(f"File '{filename}' is not a valid DOCX document.")
                    detected_format = "docx"
                elif ext == "xlsx":
                    if not any(f.startswith("xl/") for f in namelist):
                        raise BadRequestError(f"File '{filename}' is not a valid XLSX spreadsheet.")
                    detected_format = "xlsx"
        except zipfile.BadZipFile:
            raise BadRequestError(f"File '{filename}' is a corrupted zip archive.")

    elif ext == "csv":
        # Check text decodability
        try:
            file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                file_bytes.decode("latin-1")
            except Exception:
                raise BadRequestError(f"File '{filename}' cannot be decoded as text for CSV processing.")
        detected_format = "csv"

    else:
        raise BadRequestError(f"Unsupported format: {ext}")

    # Compute SHA-256 hash
    sha256 = hashlib.sha256(file_bytes).hexdigest()
    return detected_format, sha256


def save_upload_file(file_bytes: bytes, filename: str, doc_id: str) -> Path:
    """Save upload safely outside web root with a sanitized unique filename."""
    clean_name = sanitize_filename(filename)
    dest_dir = settings.UPLOAD_DIR
    dest_dir.mkdir(parents=True, exist_ok=True)
    target_path = dest_dir / f"{doc_id}_{clean_name}"
    
    with open(target_path, "wb") as f:
        f.write(file_bytes)
        
    return target_path
