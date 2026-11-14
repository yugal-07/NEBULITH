# Planetary Time Machine

**Purpose:** Expose temporal change and analog stability for Earth candidate regions using compatible satellite observations.

## Scope
### In scope
- Implement the planetary time machine capability: Expose temporal change and analog stability for Earth candidate regions using compatible satellite observations.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Build HLS/Landsat scene timeline for bounded AOI.; Track valid observations, cloud gaps and season/date context.; Compute descriptive stability/drift metrics only on harmonized variables.

### Out of scope
- Upstream capabilities owned by: 23-earth-observation-ingestion.md, 29-multi-dimensional-feature-extraction.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P40-001] Build HLS/Landsat scene timeline for bounded AOI.
- [ ] [TASK:P40-002] Track valid observations, cloud gaps and season/date context.
- [ ] [TASK:P40-003] Compute descriptive stability/drift metrics only on harmonized variables.
- [ ] [TASK:P40-004] Show campaign-window candidates with uncertainty.

## Dependencies
- `23-earth-observation-ingestion.md`
- `29-multi-dimensional-feature-extraction.md`

## Acceptance criteria
- [ ] Timeline shows actual observation dates and missing periods.
- [ ] Earth seasonal trends are not claimed equivalent to Mars seasons.

## Anti-slop alignment
human skill: missing state; UI UX animation is purposeful and reduced-motion aware.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
