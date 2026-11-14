# Cave and Subsurface Analog Assessment

**Purpose:** Characterize cave, lava-tube, karst, ice-cave and subsurface analog opportunities while making sparse coverage and geometric uncertainty explicit.

## Scope
### In scope
- Curated cave/subsurface candidate inventory where accessible geospatial or field evidence exists.
- Entrance locations, known geometry, morphology, geology, thermal observations and source confidence.
- Data gaps and evidence quality.
### Out of scope
- Human access, structural stability or habitability certification.
- Global cave completeness claims or unsupported geometry reconstruction.

## Tasks
- [ ] [TASK:CAVE-001] Define cave/subsurface schema and evidence grades.
- [ ] [TASK:CAVE-002] Identify authoritative public inventories and research datasets for a small curated candidate set.
- [ ] [TASK:CAVE-003] Build source-linked candidates with explicit unknown fields.
- [ ] [TASK:CAVE-004] Add map symbols and a detail panel showing geometry availability and limitations.
- [ ] [TASK:CAVE-005] Test that safety claims are blocked when required measurements are absent.

## Dependencies
- `04-architecture.md`
- `08-data-sources-and-ingestion.md`
- `22-data-catalog-source-registry.md`
- `51-provenance-and-citations.md`

## Acceptance criteria
- Each candidate has a traceable source and evidence grade.
- Unknown dimensions remain unknown; inferred geometry is not presented as measured.
- No access or structural-safety certification is produced.

## Anti-slop alignment
- antislop core R-17/R-36: no fabricated data or claims.
- antislop-code: preserve executable code during comment review.
- UI UX Pro Max accessibility: map symbols have text and keyboard alternatives.

## Estimated effort
L

## Status
**Status:** Not started
