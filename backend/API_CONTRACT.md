# NEBULITH API Contract: Candidate & Analysis Response Shape

This document defines the REST API integration contract for the frontend team (Codex). The OpenAPI 3.1 specification is generated at `backend/openapi.json` and hosted live at `/openapi.json` (interactive Swagger UI at `/docs` and ReDoc at `/redoc`).

---

## 1. Analysis Candidate Object Shape

When querying candidate locations from `GET /api/v1/analysis/{run_id}/candidates` or retrieving run details, each candidate strictly conforms to the following schema:

```json
{
  "id": "cand-89a1b2c3",
  "analysis_run_id": "run-45f6e7d8",
  "rank": 1,
  "name": "Atacama Desert (Yungay Core)",
  "country": "Chile",
  "latitude": -24.08,
  "longitude": -69.95,
  "region_geojson": {
    "type": "Polygon",
    "coordinates": [
      [
        [-70.0, -24.2],
        [-69.8, -24.2],
        [-69.8, -24.0],
        [-70.0, -24.0],
        [-70.0, -24.2]
      ]
    ]
  },
  "suitability_score": 87.5,
  "data_coverage": 0.95,
  "confidence": 0.92,
  "criteria_breakdown": [
    {
      "parameter": "mean_temperature",
      "target": {
        "min": 210.0,
        "max": 240.0,
        "unit": "K"
      },
      "observed": {
        "value": 288.15,
        "unit": "K"
      },
      "similarity": 0.62,
      "weight": 1.0,
      "missing": false
    },
    {
      "parameter": "aridity",
      "target": {
        "classification": "hyper-arid"
      },
      "observed": {
        "classification": "hyper-arid"
      },
      "similarity": 1.0,
      "weight": 0.8,
      "missing": false
    },
    {
      "parameter": "ph",
      "target": {
        "min": 7.5,
        "max": 8.5
      },
      "observed": null,
      "similarity": 0.0,
      "weight": 0.5,
      "missing": true
    }
  ],
  "evidence": [
    {
      "id": "ev-01a2b3",
      "document_id": "doc-9f8e7d",
      "chunk_id": "chk-1234",
      "title": "Hyper-arid Soil Analogs at Yungay",
      "page": 12,
      "quote": "The Yungay region in the Atacama is an established planetary analog for hyper-arid soil chemistry and UV radiation."
    }
  ],
  "differences": [
    "Observed mean temperature (288.15 K) exceeds target Martian range (210-240 K)."
  ],
  "explanation": "Atacama Desert (Yungay Core) matches hyper-arid classification and sulfate mineralogy closely, but experiences substantially higher ambient temperature and atmospheric pressure than Mars.",
  "created_at": "2026-11-15T04:20:00Z"
}
```

---

## 2. Key Rules & Guarantees for Frontend Integration

1. **Deterministic Scoring**:
   - `suitability_score` (0.0 to 100.0) is calculated mathematically via explicit weighted similarity functions over real Earth geospatial layers and user-configured criteria. The LLM does not generate scores.
2. **Explicit Missing Data**:
   - When geospatial layers or document sources lack measurements for a parameter, `observed` is strictly `null` and `"missing": true`. The system never pads with defaults or LLM guesses.
3. **CORS & Origin Policies**:
   - In development, CORS is configured to allow all local origins (`http://localhost:*` and `http://127.0.0.1:*`, including Vite port 5173). Preflight `OPTIONS` requests are supported with full headers and methods.
4. **Verbatim Grounded Quotes**:
   - In both RAG answers and extracted parameters, every cited quote is programmatically verified against the raw text of the chunk before exposure to the frontend.

---

## 3. Document Ingestion API

### `POST /api/v1/documents`
- **Content-Type**: `multipart/form-data`
- **Field Name**: `files` (accepts multiple files in a single request)
- **Supported File Types**: PDF (`.pdf`), DOCX (`.docx`), CSV (`.csv`), XLSX (`.xlsx`).
- **File Limits**: Max 50 MB per file.
- **Behavior**: Returns HTTP 202 Accepted with a per-file result list so that one invalid file does not fail the batch.

**Response (HTTP 202):**
```json
{
  "message": "Processed 2 file(s): 1 queued/ready, 1 failed.",
  "total_files": 2,
  "successful_count": 1,
  "failed_count": 1,
  "documents": [
    {
      "id": "817222c1-701d-4cdb-bb48-b8578a3cac0a",
      "filename": "paper_two_column_table.pdf",
      "status": "queued",
      "is_duplicate": false,
      "error": null
    },
    {
      "id": null,
      "filename": "malicious.exe",
      "status": null,
      "is_duplicate": null,
      "error": "Executable files (.exe, .dll, ELF) are forbidden for security reasons."
    }
  ]
}
```

### `GET /api/v1/documents`
- **Query Parameters**:
  - `limit`: int (default `50`, max `200`)
  - `offset`: int (default `0`)
- **Response (HTTP 200)**:
```json
[
  {
    "id": "817222c1-701d-4cdb-bb48-b8578a3cac0a",
    "title": "Svalbard as a Martian Analog",
    "filename": "svalbard_paper.pdf",
    "file_type": "application/pdf",
    "size_bytes": 1048576,
    "status": "ready",
    "progress": 1.0,
    "error_message": null,
    "chunk_count": 14,
    "uploaded_at": "2026-11-15T09:30:00Z",
    "metadata": {
      "title": "Svalbard as a Martian Analog",
      "authors": ["Reiss, D.", "Hauber, E."],
      "year": 2010,
      "doi": "10.1016/j.pss.2010.04.015"
    }
  }
]
```

### `GET /api/v1/documents/{id}/status`
- **Response (HTTP 200)**:
```json
{
  "document_id": "817222c1-701d-4cdb-bb48-b8578a3cac0a",
  "status": "ready",
  "progress": 1.0,
  "chunk_count": 14,
  "error_message": null
}
```
*Possible `status` values: `queued`, `parsing`, `chunking`, `embedding`, `ready`, `needs_ocr`, `failed`.*

### `DELETE /api/v1/documents/{id}`
- **Response**: HTTP 204 No Content. Deletes document record, storage file, chunks, embeddings, and extracted parameters.

---

## 4. Hybrid RAG API

### `GET /api/v1/rag/config`
Provides configuration needed by the frontend UI to display active models or show a "Mock Mode" banner when no API key is supplied:

```json
{
  "active_llm_provider": "mock",
  "is_real_llm_configured": false,
  "embedding_model": "BAAI/bge-small-en-v1.5",
  "embedding_dimension": 384,
  "max_top_k": 20
}
```

### `POST /api/v1/rag/query`
- **Request Body**:
```json
{
  "question": "What is the average surface temperature recorded at the landing site?",
  "document_ids": ["817222c1-701d-4cdb-bb48-b8578a3cac0a"],
  "top_k": 5
}
```
- **Response (HTTP 200)**:
```json
{
  "answer": "The recorded surface temperature averages 215 K (-58 °C) with seasonal fluctuations between 190 K and 240 K [1].",
  "citations": [
    {
      "citation_id": 1,
      "chunk_id": "c1f2e3d4",
      "document_id": "817222c1-701d-4cdb-bb48-b8578a3cac0a",
      "document_title": "Svalbard as a Martian Analog",
      "page_number": 4,
      "section": "Results",
      "verbatim_quote": "The recorded surface temperature averages 215 K (-58 °C) with seasonal fluctuations between 190 K and 240 K.",
      "relevance_score": 0.89
    }
  ],
  "retrieved_chunks": [ ... ],
  "model_used": "mock",
  "total_chunks_searched": 14
}
```
*When answers are not present in the documents, the response answer is strictly: `"The provided sources do not contain information to answer this question."` with empty citations.*

---

## 5. Structured Parameter Extraction API

### `POST /api/v1/documents/{id}/extract`
Extracts target environmental parameters for a single document.

### `POST /api/v1/analysis/extract`
Extracts and consolidates parameters across multiple documents:
- **Request Body**:
```json
{
  "document_ids": [
    "817222c1-701d-4cdb-bb48-b8578a3cac0a",
    "f2a1b3c4-90de-4fed-81aa-0987654321ab"
  ]
}
```
- **Response (HTTP 200)**:
```json
{
  "document_ids": ["817222c1-701d-4cdb-bb48-b8578a3cac0a"],
  "total_parameters_evaluated": 14,
  "found_parameters_count": 4,
  "missing_parameters_count": 10,
  "conflict_count": 0,
  "parameters": [
    {
      "id": "param-101",
      "parameter_name": "mean_temperature",
      "raw_value": 215.0,
      "unit": "K",
      "normalized_value": 215.0,
      "normalized_unit": "K",
      "document_id": "817222c1-701d-4cdb-bb48-b8578a3cac0a",
      "chunk_id": "c1f2e3d4",
      "page_number": 4,
      "verbatim_quote": "The recorded surface temperature averages 215 K (-58 °C).",
      "confidence": 0.95,
      "extraction_method": "heuristic_pattern",
      "is_missing": false,
      "is_conflict": false,
      "conflict_details": null
    },
    {
      "id": null,
      "parameter_name": "annual_precipitation",
      "raw_value": null,
      "unit": null,
      "normalized_value": null,
      "normalized_unit": null,
      "document_id": "817222c1-701d-4cdb-bb48-b8578a3cac0a",
      "chunk_id": null,
      "page_number": null,
      "verbatim_quote": null,
      "confidence": 0.0,
      "extraction_method": "not_found",
      "is_missing": true,
      "is_conflict": false,
      "conflict_details": null
    }
  ]
}
```

### `GET /api/v1/documents/{id}/parameters`
Returns previously extracted and persisted parameters for document `{id}`.

---

## 6. Standard Error Response Contract

All error responses from the API follow this uniform structure:

```json
{
  "error": {
    "code": "file_too_large",
    "message": "File 'large_dataset.csv' exceeds maximum allowed size of 52428800 bytes.",
    "request_id": "req-98e7-45ab-b001",
    "details": {
      "filename": "large_dataset.csv",
      "max_bytes": 52428800
    }
  }
}
```

The HTTP status code carries the status (for example, 413); the JSON body is always
`{ "error": { "code", "message", "details", "request_id" } }`.

### Common Error Codes:
- `400 Bad Request`: `unsupported_file_type`, `bad_request`, `validation_error`
- `404 Not Found`: `not_found`, `document_not_found`, `chunk_not_found`
- `413 Payload Too Large`: `file_too_large`
- `422 Unprocessable Entity`: `validation_error`
- `500 Internal Server Error`: `internal_server_error`
