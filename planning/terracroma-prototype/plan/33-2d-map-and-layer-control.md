# 2D map and layer control

**Purpose:** Provide a responsive spatial view with candidate markers, AOI, evidence layers and measurement tools.

## Scope
### In scope
- Implement the 2d map and layer control capability: Provide a responsive spatial view with candidate markers, AOI, evidence layers and measurement tools.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Add basemap/imagery, terrain and geology overlays.; Implement AOI draw, area/distance, coordinate inspection and filtering.; Expose legends, source metadata and no-data masks.

### Out of scope
- Upstream capabilities owned by: 25-geospatial-normalization-and-tiling.md, 26-analog-candidate-index.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P33-001] Add basemap/imagery, terrain and geology overlays.
- [ ] [TASK:P33-002] Implement AOI draw, area/distance, coordinate inspection and filtering.
- [ ] [TASK:P33-003] Expose legends, source metadata and no-data masks.

## Dependencies
- `25-geospatial-normalization-and-tiling.md`
- `26-analog-candidate-index.md`

## Acceptance criteria
- [ ] Layer switching updates the legend/source panel and map.
- [ ] Mobile controls do not cause horizontal overflow.

## Anti-slop alignment
antislop-layoutmobile and human; UI UX charts/data.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
