# NEBULITH API

Local-first FastAPI service for studies and evidence-aware contracts. It intentionally returns empty/unconfigured source and target catalogs until datasets are verified and added. The API must not infer scientific values from the visual globe textures.

## Run locally

```powershell
python -m pip install -r backend/requirements.txt
$env:NEBULITH_DB_PATH = "$PWD/backend/data/nebulith.sqlite3"
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

OpenAPI is available at `http://127.0.0.1:8000/docs`. Set `NEBULITH_CORS_ORIGINS` to a comma-separated list of exact local frontend origins when needed. Keep provider credentials server-side.

## Contract behavior

- Missing or unconfigured evidence remains `null`, with an explicit coverage status.
- Sources and targets currently return `not_configured`; no candidate ranking is fabricated.
- Study state persists in SQLite. Set `NEBULITH_DB_PATH` to choose another local database path.
- Comparison, transferability and route endpoints return a structured `409 data_not_configured` until their data and methods are implemented.
- A report endpoint may return an incomplete study snapshot with its limitations and no scientific findings.
- Route models require `not_a_safety_certification: true`.
