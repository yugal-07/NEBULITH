# Rover route planner

**Purpose:** Create and compare routes over a bounded terrain grid using explicit mobility assumptions.

## Scope
### In scope
- Implement the rover route planner capability: Create and compare routes over a bounded terrain grid using explicit mobility assumptions.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Allow start/end/checkpoint selection.; Compute distance and terrain cost over a DEM-derived grid.; Show slope/roughness penalties and route limitations.

### Out of scope
- Upstream capabilities owned by: 35-terrain-hazard-analysis.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P36-001] Allow start/end/checkpoint selection.
- [ ] [TASK:P36-002] Compute distance and terrain cost over a DEM-derived grid.
- [ ] [TASK:P36-003] Show slope/roughness penalties and route limitations.
- [ ] [TASK:P36-004] Export route geometry.

## Dependencies
- `35-terrain-hazard-analysis.md`

## Acceptance criteria
- [ ] A route can be recomputed deterministically with config.
- [ ] No route is labelled safe; unknown segments are flagged.

## Anti-slop alignment
human and UI UX touch interaction; antislop-code comments for model assumptions.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
