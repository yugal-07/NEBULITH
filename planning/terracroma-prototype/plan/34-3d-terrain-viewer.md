# 3D terrain viewer

**Purpose:** Render an evidence-aware 3D terrain scene for selected Earth/planet AOIs.

## Scope
### In scope
- Implement the 3d terrain viewer capability: Render an evidence-aware 3D terrain scene for selected Earth/planet AOIs.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Load bounded DEM meshes/tiles.; Support camera orbit, zoom, home, layer toggles and selection.; Show vertical exaggeration and elevation unit metadata.

### Out of scope
- Upstream capabilities owned by: 25-geospatial-normalization-and-tiling.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P34-001] Load bounded DEM meshes/tiles.
- [ ] [TASK:P34-002] Support camera orbit, zoom, home, layer toggles and selection.
- [ ] [TASK:P34-003] Show vertical exaggeration and elevation unit metadata.

## Dependencies
- `25-geospatial-normalization-and-tiling.md`

## Acceptance criteria
- [ ] 3D scene uses actual DEM or clearly marked preview geometry.
- [ ] Camera controls work on touch/keyboard alternatives.

## Anti-slop alignment
antislop-ui: motion and effects need purpose; layoutmobile: 3D is optional on narrow screens.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
