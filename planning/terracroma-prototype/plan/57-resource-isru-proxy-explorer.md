# Resource and ISRU Proxy Explorer

**Purpose:** Present evidence-backed resource indicators relevant to mission planning without claiming remote sensing proves an extractable reserve.

## Scope
### In scope
- Mineralogical signatures, volatile/water-ice proxy layers where authoritative data exist, illumination and solar opportunity context.
- Per-layer provenance, resolution, uncertainty, acquisition date and evidence class.
- Distinction between detected signatures, interpreted potential and confirmed in-situ resources.
### Out of scope
- Reserve estimation, mining feasibility certification, proof of water availability or engineering guarantees.

## Tasks
- [ ] [TASK:RES-001] Define resource taxonomy: mineral signature, volatile proxy, thermal context, illumination and energy opportunity.
- [ ] [TASK:RES-002] Register candidate Earth and planetary products with official product pages, versions, units, resolution, CRS and licenses.
- [ ] [TASK:RES-003] Implement resource evidence records with observed, derived, modeled, inferred and unknown classes.
- [ ] [TASK:RES-004] Add a UI panel showing evidence coverage and missing-data warnings.
- [ ] [TASK:RES-005] Test that proxy indicators are never labelled confirmed resources.

## Dependencies
- `04-architecture.md`
- `08-data-sources-and-ingestion.md`
- `09-scientific-model-and-scoring.md`
- `51-provenance-and-citations.md`

## Acceptance criteria
- Every indicator links to its source product and processing method.
- Missing coverage is unknown, not zero or a negative finding.
- Proxy, derived estimate and ground-confirmed measurement are visually distinct.
- No reserve/extractability claim appears without a validated method.

## Anti-slop alignment
- antislop core R-17/R-36: no unsupported numbers or claims.
- antislop-code: comments explain scientific constraints, not obvious code.
- UI UX Pro Max: visual encodings preserve units and uncertainty.

## Estimated effort
L

## Status
**Status:** Not started
