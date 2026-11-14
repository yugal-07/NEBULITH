# Research RAG and paper assistant

**Purpose:** Retrieve literature context and cite passages to support scientific interpretation and experiment planning.

## Scope
### In scope
- Implement the research rag and paper assistant capability: Retrieve literature context and cite passages to support scientific interpretation and experiment planning.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Build source-attributed document library.; Retrieve chunk-level passages and exact page references.; Answer only from retrieved evidence and label synthesis.

### Out of scope
- Upstream capabilities owned by: 16-backend-api-and-data-model.md, 51-provenance-and-citations.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P37-001] Build source-attributed document library.
- [ ] [TASK:P37-002] Retrieve chunk-level passages and exact page references.
- [ ] [TASK:P37-003] Answer only from retrieved evidence and label synthesis.
- [ ] [TASK:P37-004] Separate citations from geospatial measurement pipeline.

## Dependencies
- `16-backend-api-and-data-model.md`
- `51-provenance-and-citations.md`

## Acceptance criteria
- [ ] Every answer cites page/section and source document.
- [ ] RAG output cannot change measurement values or scoring directly.

## Anti-slop alignment
copywriting: no invented attribution; human: accessible upload and feedback.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
