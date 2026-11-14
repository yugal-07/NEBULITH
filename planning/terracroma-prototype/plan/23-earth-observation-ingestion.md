# Earth observation ingestion

**Purpose:** Acquire and normalize Earth elevation, optical time-series and mineralogical data for selected analog regions.

## Scope
### In scope
- Implement the earth observation ingestion capability: Acquire and normalize Earth elevation, optical time-series and mineralogical data for selected analog regions.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Implement CMR collection/granule query for SRTM/HLS/EMIT.; Add Earthdata Login handling server-side and a public-data cache.; Create cloud mask/quality mask handling and raster metadata manifest.

### Out of scope
- Upstream capabilities owned by: 22-data-catalog-source-registry.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P23-001] Implement CMR collection/granule query for SRTM/HLS/EMIT.
- [ ] [TASK:P23-002] Add Earthdata Login handling server-side and a public-data cache.
- [ ] [TASK:P23-003] Create cloud mask/quality mask handling and raster metadata manifest.
- [ ] [TASK:P23-004] Preserve EMIT uncertainty and orthorectification requirements.

## Dependencies
- `22-data-catalog-source-registry.md`

## Acceptance criteria
- [ ] A bounded AOI can be acquired reproducibly.
- [ ] Each raster has checksum, source ID, acquisition date, CRS and nodata metadata.
- [ ] No credentials are present in browser code.

## Anti-slop alignment
antislop-code: explain non-obvious transforms; core R-17: sourced values only.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
