# NEBULITH Backend

NEBULITH is an AI-powered planetary research and Earth-analog discovery platform. The backend parses scientific papers, tables, and datasets, extracts target environment parameters with citations, and executes deterministic scoring against real Earth geospatial layers to identify high-fidelity analog locations.

---

## Architecture & Project Structure

```
backend/
├── api/
│   ├── v1/
│   │   ├── router.py         # Versioned v1 API router aggregation
│   │   ├── health.py         # GET /health and database ping
│   │   ├── documents.py      # Multipart file ingestion & chunking (Phase 2)
│   │   ├── rag.py            # Hybrid retrieval & grounded RAG with citations (Phase 3)
│   │   ├── extraction.py     # Parameter extraction & verification (Phase 4)
│   │   ├── criteria.py       # Criteria set builder & weights (Phase 5)
│   │   └── analysis.py       # Geospatial analysis runs & discovery (Phase 7)
│   └── legacy.py             # Backward compatibility layer for frontend integration
├── core/
│   ├── config.py             # Pydantic v2 settings loading from .env
│   ├── database.py           # SQLAlchemy engine, session management, and DB dependency
│   ├── errors.py             # Structured error handlers and custom AppException hierarchy
│   ├── logging.py            # Structured logging configuration
│   ├── interfaces.py         # Swappable LLMProvider and EmbeddingProvider ABCs
│   └── providers/
│       ├── embedding.py      # Mock (deterministic offline) & OpenAI embedding providers
│       └── llm.py            # Mock & OpenAI structured LLM completion providers
├── models/
│   ├── base.py               # Declarative Base, VectorType decorator, UUID helpers
│   ├── document.py           # Document and Chunk models
│   ├── parameter.py          # ExtractedParameter model with verification & conflict tracking
│   ├── criteria.py           # CriteriaSet model with tolerance functions & weights
│   └── analysis.py           # AnalysisRun, Candidate, and CandidateEvidence models
├── ingestion/                # Document parsers (PDF, DOCX, CSV, XLSX) and chunking engine
├── rag/                      # Vector + keyword hybrid retrieval and citation grounding
├── extraction/               # Target planetary environment schema & pint unit conversions
├── scoring/                  # Deterministic mathematical suitability and coverage scoring
├── geo/                      # Global raster/vector grid processing and gazetteer clustering
├── storage/                  # Sanitized file upload storage outside web root
├── tests/                    # Pytest test suite
├── Dockerfile                # Container definition
├── docker-compose.yml        # PostgreSQL + pgvector service and backend composition
├── alembic.ini               # Database migrations configuration
└── main.py                   # FastAPI application factory and ASGI entrypoint
```

---

## Core Rules & Design Guarantees

1. **No LLM Number Inventions**:
   - Every scientific parameter must be traceable to a specific source document chunk and verbatim quote.
   - Suitability scores are computed **strictly** through deterministic mathematical formulas over explicit criteria and real geospatial data. The LLM only extracts, explains, and summarizes.
2. **Explicit Missing Data**:
   - If a geospatial layer or parameter is unavailable, it is returned as `null` with `"missing": true`. It is never padded or guessed.
3. **Swappable Providers**:
   - LLM and embedding providers are behind modular interfaces (`LLMProvider`, `EmbeddingProvider`). In offline/test mode, deterministic mock implementations run without network access or API keys.
4. **CORS & OpenAPI**:
   - Dev CORS enabled for `http://localhost:*` and `http://127.0.0.1:*`.
   - Complete OpenAPI schema available at `/openapi.json` and saved to `backend/openapi.json`.

---

## Running Locally (SQLite Dev Mode)

1. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env`:
   ```bash
   cp backend/.env.example .env
   ```
   By default, `DATABASE_URL` is set to `sqlite:///./backend/data/nebulith.db`.

3. **Start the API Server**:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Verify Health**:
   ```bash
   curl http://localhost:8000/health
   ```
   Interactive Swagger docs are available at `http://localhost:8000/docs`.

---

## Running with Docker (PostgreSQL + pgvector)

To run the containerized stack with PostgreSQL 16 and pgvector:

```bash
docker compose -f backend/docker-compose.yml up --build -d
```

This starts:
- `nebulith-pgvector` on port `5432`
- `nebulith-backend` on port `8000`

---

## Running Tests

Run the test suite using `pytest`:

```bash
pytest backend/tests -v
```
