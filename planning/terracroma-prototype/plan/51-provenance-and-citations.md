# Provenance and citations

**Purpose:** Provide a complete evidence lineage from a map layer or RAG statement back to source data and transformation.

## Scope
### In scope
- Implement the provenance and citations capability: Provide a complete evidence lineage from a map layer or RAG statement back to source data and transformation.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Define provenance schema for raw/derived/modelled/inferred values.; Record citation, access date, resolution, CRS, units, license and processing history.; Generate provenance manifest in report exports.

### Out of scope
- Upstream capabilities owned by: 08-data-sources-and-ingestion.md, 16-backend-api-and-data-model.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P51-001] Define provenance schema for raw/derived/modelled/inferred values.
- [ ] [TASK:P51-002] Record citation, access date, resolution, CRS, units, license and processing history.
- [ ] [TASK:P51-003] Generate provenance manifest in report exports.

## Dependencies
- `08-data-sources-and-ingestion.md`
- `16-backend-api-and-data-model.md`

## Acceptance criteria
- [ ] A reviewer can reproduce every displayed metric from its manifest.
- [ ] No source citation is generic or fabricated.

## Anti-slop alignment
copywriting: no weasel attributions; core R-17; code: preserve API contracts.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
