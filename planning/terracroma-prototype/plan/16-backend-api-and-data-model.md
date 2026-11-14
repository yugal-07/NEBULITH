# Backend API and data model

**Purpose:** Define data contracts for source metadata, AOIs, features, candidates, mission profiles, scores, gap assessments and research artifacts.

## Scope
### In scope
- Typed API contracts, persistence and provenance
- REST endpoints for discovery, comparison, mission setup and reports

### Out of scope
- LLM as sole persistence authority
- Unversioned cached calculations

## Tasks
- [ ] [TASK:P16-001] Model data lineage and units in schema.
- [ ] [TASK:P16-002] Define API request/response contracts for each core workflow.
- [ ] [TASK:P16-003] Persist scoring configurations and computed result versions.
- [ ] [TASK:P16-004] Add cache invalidation by data product and processing version.
- [ ] [TASK:P16-005] Protect upload endpoints and external credentials.

## Dependencies
- `04-architecture.md`
- `05-tech-stack.md`
- `08-data-sources-and-ingestion.md`

## Acceptance criteria
- [ ] Schemas distinguish raw, derived, inferred and qualitative values.
- [ ] Each result is reproducible from stored inputs and versions.
- [ ] API validation rejects unknown units/CRS and invalid geometries.

## Anti-slop alignment
antislop-code: comments preserve real rationale; core R-17: numeric claims trace to data.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
