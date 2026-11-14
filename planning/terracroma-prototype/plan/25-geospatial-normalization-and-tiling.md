# Geospatial normalization and tiling

**Purpose:** Harmonize AOIs, projection, resolution, units, raster nodata and tile delivery while retaining original source metadata.

## Scope
### In scope
- Implement the geospatial normalization and tiling capability: Harmonize AOIs, projection, resolution, units, raster nodata and tile delivery while retaining original source metadata.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Validate geometry and CRS; reproject only with recorded transformations.; Resample only when method and target grid are declared.; Generate COG/tiles for bounded AOIs.

### Out of scope
- Upstream capabilities owned by: 23-earth-observation-ingestion.md, 24-planetary-data-ingestion.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P25-001] Validate geometry and CRS; reproject only with recorded transformations.
- [ ] [TASK:P25-002] Resample only when method and target grid are declared.
- [ ] [TASK:P25-003] Generate COG/tiles for bounded AOIs.
- [ ] [TASK:P25-004] Derive hillshade/slope/roughness with scale-aware settings.

## Dependencies
- `23-earth-observation-ingestion.md`
- `24-planetary-data-ingestion.md`

## Acceptance criteria
- [ ] Earth and planetary layers render in their native context and comparison grids.
- [ ] Resampling, scale and datum differences are displayed.

## Anti-slop alignment
layoutmobile: tile-based progressive loading; antislop-ui: meaningful map layers.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
