from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Set deterministic test configuration before importing application settings.
# Tests must not connect to the development DB or write to development storage,
# even if a local .env file points there.
_TEST_UPLOAD_ROOT = Path(tempfile.mkdtemp(prefix="nebulith-pytest-uploads-"))
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["UPLOAD_DIR"] = str(_TEST_UPLOAD_ROOT)
os.environ["ENVIRONMENT"] = "testing"
os.environ["LLM_PROVIDER"] = "mock"
os.environ["EMBEDDING_PROVIDER"] = "local"
for _secret_key in ("OPENAI_API_KEY", "GEMINI_API_KEY", "ANTHROPIC_API_KEY"):
    os.environ[_secret_key] = ""

import backend.core.database as db_module
from backend.core.config import settings
from backend.core.database import Base, get_db
from backend.main import app

# Create in-memory SQLite database for isolated test execution
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Patch global database engine and sessionmaker during test runs
db_module.engine = test_engine
db_module.SessionLocal = TestingSessionLocal
# Tests that ingest documents use deterministic vectors. The settings default
# remains local and is asserted separately by test_config.
settings.EMBEDDING_PROVIDER = "mock"


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    assert db_module.engine is test_engine
    assert str(settings.UPLOAD_DIR) == str(_TEST_UPLOAD_ROOT)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
