# System architecture

**Purpose:** Define a modular architecture separating scientific ingestion, derived geospatial features, scoring, agent orchestration, API and interactive map UI.

## Scope
### In scope
- Earth and planetary data adapters
- Spatial data pipeline and reproducible feature store
- Deterministic scoring and transferability logic
- RAG/agent orchestration gated by scientific evidence
- Map, 3D viewer, comparison and mission-planning UI

### Out of scope
- Microservices for every feature
- Real-time streaming architecture without a use case
- LLM-owned numerical computation

## Tasks
- [ ] [TASK:P04-001] Define adapter contracts and provenance envelope.
- [ ] [TASK:P04-002] Separate raw data, normalized layers, derived metrics and scored candidates.
- [ ] [TASK:P04-003] Separate deterministic science services from LLM explanation/research assistance.
- [ ] [TASK:P04-004] Define APIs for candidate scan, comparison, transferability, experiment coverage and reports.
- [ ] [TASK:P04-005] Define graceful degradation when external sources are unavailable.

## Dependencies
- `03-core-ideas.md`

## Hackathon vertical-slice boundary
Build one end-to-end vertical slice before adding breadth:
`curated source manifest -> normalized AOI features -> deterministic mission score -> evidence explanation -> comparison -> transferability gaps -> bounded route -> reproducible report`.
Use one FastAPI application and one React client. Do not split into microservices. Raster processing runs as a backend/preprocessing job and the browser receives bounded GeoJSON, tiles or a preprocessed terrain mesh. A cached local study must work without network access.

## Acceptance criteria
- [ ] A diagram shows raw → normalized → features → scoring → evidence → UI.
- [ ] Every score can be recomputed from versioned inputs and config.
- [ ] The agent cannot overwrite measured fields or directly alter a score.

## Anti-slop alignment
antislop-code: comments only explain constraints; core C-1 intentionality; UI UX Pro Max implementation uses stack-specific patterns.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
