from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.config import settings
from ...core.database import get_db

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Health check endpoint to verify API and database connectivity."""
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    storage_status = "ok" if settings.UPLOAD_DIR.exists() else "created"
    if not settings.UPLOAD_DIR.exists():
        settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "version": settings.VERSION,
        "database": db_status,
        "dialect": "sqlite" if settings.is_sqlite else "postgresql",
        "storage": storage_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
