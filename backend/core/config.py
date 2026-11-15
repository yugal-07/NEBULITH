from __future__ import annotations

import os
from pathlib import Path
from typing import Literal
from dotenv import load_dotenv
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)

DEFAULT_FRONTEND_ORIGIN = "https://nebulith.netlify.app"
DEFAULT_DEVELOPMENT_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8001",
)


def cors_origins_from_env() -> list[str]:
    """Return the canonical frontend plus configured additional origins."""
    raw_origins = (
        os.getenv("FRONTEND_ORIGIN", DEFAULT_FRONTEND_ORIGIN),
        *os.getenv("CORS_ORIGINS", ",".join(DEFAULT_DEVELOPMENT_ORIGINS)).split(","),
    )
    origins: list[str] = []
    for raw_origin in raw_origins:
        origin = raw_origin.strip().rstrip("/")
        if origin and origin not in origins:
            origins.append(origin)
    return origins


class Settings(BaseModel):
    # General
    PROJECT_NAME: str = "NEBULITH"
    VERSION: str = "0.2.0"
    ENVIRONMENT: Literal["development", "production", "testing"] = os.getenv("ENVIRONMENT", "development")  # type: ignore
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGIN_REGEX: str = os.getenv("CORS_ORIGIN_REGEX", r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$")
    CORS_ORIGINS: list[str] = Field(default_factory=cors_origins_from_env)

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR}/backend/data/nebulith.db",
    )
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))

    # Storage & Uploads
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "backend" / "storage" / "uploads")))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    ALLOWED_EXTENSIONS: set[str] = {"pdf", "docx", "csv", "xlsx"}

    # Embedding Provider Configuration
    EMBEDDING_PROVIDER: Literal["mock", "openai", "gemini", "local"] = os.getenv("EMBEDDING_PROVIDER", "local")  # type: ignore
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))
    EMBEDDING_BATCH_SIZE: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "32"))

    # LLM Provider Configuration
    LLM_PROVIDER: Literal["mock", "openai", "gemini", "anthropic"] = os.getenv("LLM_PROVIDER", "mock")  # type: ignore
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.5-flash")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY")

    # Ingestion & Chunking
    CHUNK_SIZE_TOKENS: int = int(os.getenv("CHUNK_SIZE_TOKENS", "600"))
    CHUNK_OVERLAP_TOKENS: int = int(os.getenv("CHUNK_OVERLAP_TOKENS", "100"))

    # Geospatial
    GRID_RESOLUTION_DEG: float = float(os.getenv("GRID_RESOLUTION_DEG", "1.0"))
    DATASETS_DIR: Path = Path(os.getenv("DATASETS_DIR", str(BASE_DIR / "backend" / "data" / "geospatial")))

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


settings = Settings()
