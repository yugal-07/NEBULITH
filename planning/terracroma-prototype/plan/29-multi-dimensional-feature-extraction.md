# Multi-dimensional feature extraction

**Purpose:** Derive comparable terrain and surface descriptors from source rasters and product metadata.

## Scope
### In scope
- Implement the multi-dimensional feature extraction capability: Derive comparable terrain and surface descriptors from source rasters and product metadata.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Compute slope, local relief and windowed roughness in physical units.; Extract spectral/mineral indicators only from validated product bands.; Aggregate temperature/time-series descriptors when context matches.

### Out of scope
- Upstream capabilities owned by: 23-earth-observation-ingestion.md, 24-planetary-data-ingestion.md, 25-geospatial-normalization-and-tiling.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P29-001] Compute slope, local relief and windowed roughness in physical units.
- [ ] [TASK:P29-002] Extract spectral/mineral indicators only from validated product bands.
- [ ] [TASK:P29-003] Aggregate temperature/time-series descriptors when context matches.
- [ ] [TASK:P29-004] Attach feature quality and provenance.

## Dependencies
- `23-earth-observation-ingestion.md`
- `24-planetary-data-ingestion.md`
- `25-geospatial-normalization-and-tiling.md`

## Acceptance criteria
- [ ] Features include algorithm, units, window size, data coverage and uncertainty.
- [ ] No cross-sensor feature is compared without a comparability rule.

## Anti-slop alignment
antislop-code: comments preserve algorithms/assumptions; core no invented values.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
