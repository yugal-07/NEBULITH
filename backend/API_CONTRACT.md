# NEBULITH API Contract: Candidate & Analysis Response Shape

This document defines the REST API integration contract for the frontend team (Codex). The OpenAPI 3.1 specification is generated at `backend/openapi.json` and hosted live at `/openapi.json` (interactive documentation at `/docs`).

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
      "parameter": "soil_ph",
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
   - When geospatial layers or document sources lack measurements for a parameter, `observed` is strictly `null` and `"missing": true`.
   - `data_coverage` (0.0 to 1.0) represents the fraction of total criteria weight backed by real verified data. Frontend displays low-coverage warnings whenever `data_coverage < 0.7`.
3. **Traceable Citations**:
   - Every entry in `evidence` provides `document_id`, `title`, `page`, and verbatim `quote`.
4. **CORS**:
   - Dev servers running on `http://localhost:*` and `http://127.0.0.1:*` (such as Vite on port 5173 or 3000) are permitted by default.
