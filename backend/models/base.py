from __future__ import annotations

import json
from datetime import datetime, timezone
import uuid
from typing import Any
from sqlalchemy import TypeDecorator, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from ..core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class VectorType(TypeDecorator):
    """
    SQLAlchemy TypeDecorator for vector embeddings.
    Stores vectors as JSON array strings on SQLite / non-pgvector engines,
    and supports conversion to list of floats in Python.
    """

    impl = Text
    cache_ok = True

    def __init__(self, dim: int = 768, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dim = dim

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            try:
                from pgvector.sqlalchemy import Vector
            except ImportError as exc:
                raise RuntimeError("PostgreSQL vector columns require the pgvector package") from exc
            return dialect.type_descriptor(Vector(self.dim))
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value: list[float] | None, dialect) -> str | None:
        if value is None:
            return None
        if not isinstance(value, list):
            raise ValueError(f"Expected list of floats for VectorType, got {type(value)}")
        values = [round(float(x), 6) for x in value]
        if dialect.name == "postgresql":
            return values
        return json.dumps(values)

    def process_result_value(self, value: str | None, dialect) -> list[float] | None:
        if value is None:
            return None
        if isinstance(value, list):
            return value
        return json.loads(value)
