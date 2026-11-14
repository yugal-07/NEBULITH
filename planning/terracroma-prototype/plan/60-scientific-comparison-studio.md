# Scientific Comparison Studio

**Purpose:** Provide synchronized, evidence-aware comparisons between a planetary target and terrestrial analog candidates.

## Scope
### In scope
- Side-by-side imagery/map panels, synchronized AOI where valid, per-dimension evidence, metadata and uncertainty.
- Warnings for sensor, resolution, projection, epoch and physical-meaning differences.
- Export-ready comparison snapshots.
### Out of scope
- Pixel subtraction across incompatible sensors or non-comparable products.
- Treating visual resemblance as scientific equivalence.

## Tasks
- [ ] [TASK:CMP-001] Define comparison view model and comparability metadata.
- [ ] [TASK:CMP-002] Implement synchronized map/imagery panels with independent layer metadata.
- [ ] [TASK:CMP-003] Implement dimension-by-dimension evidence and difference panels.
- [ ] [TASK:CMP-004] Add resolution, epoch, CRS and unit mismatch warnings.
- [ ] [TASK:CMP-005] Add keyboard navigation and comparison export hooks.

## Dependencies
- `04-architecture.md`
- `09-scientific-model-and-scoring.md`
- `13-geospatial-3d-digital-twin.md`
- `31-explainability-and-evidence-panel.md`
- `51-provenance-and-citations.md`

## Acceptance criteria
- User compares one target with at least two Earth candidates.
- Each dimension shows values only when available, with units and provenance.
- Incompatible layers are labelled non-comparable rather than differenced.
- Visual comparison has text evidence and uncertainty.

## Anti-slop alignment
- antislop core R-17/R-36: sourced values and claims only.
- antislop-layoutmobile: deliberate stacked comparison mode on mobile.
- UI UX Pro Max: accessible data visualization and responsive patterns.

## Estimated effort
M

## Status
**Status:** Not started
