# Geospatial and 3D digital twin

**Purpose:** Specify consistent 2D/3D exploration of Earth and planetary terrain while disclosing scale, projection and source differences.

## Scope
### In scope
- AOI rendering, DEM-derived surfaces, terrain layers, map overlays and inspection tools
- A 3D scene for one target/candidate pair

### Out of scope
- Photorealistic claims from low-resolution DEMs
- Treating mismatched planetary projections as identical geometry

## Tasks
- [ ] [TASK:P13-001] Prototype the chosen map engine with one Earth and one planetary dataset.
- [ ] [TASK:P13-002] Render slope/roughness/imagery with explicit units and legends.
- [ ] [TASK:P13-003] Add AOI drawing, coordinate inspection and layer metadata.
- [ ] [TASK:P13-004] Benchmark memory, tile latency and low-network behavior.

## Dependencies
- `25-geospatial-normalization-and-tiling.md`
- `33-2d-map-and-layer-control.md`
- `34-3d-terrain-viewer.md`

## Acceptance criteria
- [ ] Map labels CRS and units; 3D geometry is not presented as validated where no elevation exists.
- [ ] Layer source metadata is one click away.
- [ ] Mobile mode remains usable without 3D.

## Anti-slop alignment
antislop-ui: purpose-driven use of glow/shadow/motion; layoutmobile: reflow instead of shrink; human: non-color map legends and accessible alternatives.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
