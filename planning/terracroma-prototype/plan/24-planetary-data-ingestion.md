# Planetary data ingestion

**Purpose:** Retrieve Moon/Mars terrain, imagery, mineral and thermal products into the same provenance-aware pipeline.

## Scope
### In scope
- Implement the planetary data ingestion capability: Retrieve Moon/Mars terrain, imagery, mineral and thermal products into the same provenance-aware pipeline.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Discover CRISM/MOLA/LOLA/Diviner products via PDS/ODE.; Load Mars Trek WMTS layers after checking capabilities/projection.; Preserve instrument labels, product IDs and geodesy metadata.

### Out of scope
- Upstream capabilities owned by: 22-data-catalog-source-registry.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P24-001] Discover CRISM/MOLA/LOLA/Diviner products via PDS/ODE.
- [ ] [TASK:P24-002] Load Mars Trek WMTS layers after checking capabilities/projection.
- [ ] [TASK:P24-003] Preserve instrument labels, product IDs and geodesy metadata.
- [ ] [TASK:P24-004] Build one selected planetary AOI for MVP.

## Dependencies
- `22-data-catalog-source-registry.md`

## Acceptance criteria
- [ ] At least one planetary target layer is loaded with source attribution.
- [ ] Planetary coordinate conventions and units are represented explicitly.

## Anti-slop alignment
core R-17/R-36; human: source details are accessible.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
