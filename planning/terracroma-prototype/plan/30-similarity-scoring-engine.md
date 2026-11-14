# Similarity scoring engine

**Purpose:** Produce reproducible dimension scores and ranked candidates under a specific mission profile.

## Scope
### In scope
- Implement the similarity scoring engine capability: Produce reproducible dimension scores and ranked candidates under a specific mission profile.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Implement metric-specific similarity functions.; Apply validated hard constraints and normalized weights.; Report missing coverage separately from score.

### Out of scope
- Upstream capabilities owned by: 09-scientific-model-and-scoring.md, 29-multi-dimensional-feature-extraction.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P30-001] Implement metric-specific similarity functions.
- [ ] [TASK:P30-002] Apply validated hard constraints and normalized weights.
- [ ] [TASK:P30-003] Report missing coverage separately from score.
- [ ] [TASK:P30-004] Support config versioning and sensitivity perturbations.

## Dependencies
- `09-scientific-model-and-scoring.md`
- `29-multi-dimensional-feature-extraction.md`

## Acceptance criteria
- [ ] Unit tests cover known values, extremes, missing inputs and weight changes.
- [ ] Each ranking can be reproduced from config and source versions.

## Anti-slop alignment
core R-17/R-36; UI chart guidelines.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
