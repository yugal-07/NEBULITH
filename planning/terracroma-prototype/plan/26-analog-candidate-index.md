# Analog candidate index

**Purpose:** Store candidate Earth regions and link each to source evidence, geometry, score version and discovery history.

## Scope
### In scope
- Implement the analog candidate index capability: Store candidate Earth regions and link each to source evidence, geometry, score version and discovery history.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Create AOI/candidate schema with geometry and versioned features.; Index by mission profile, geography, environment and coverage.; Mark known benchmark sites separately from novel-to-catalog candidates.

### Out of scope
- Upstream capabilities owned by: 25-geospatial-normalization-and-tiling.md, 30-similarity-scoring-engine.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P26-001] Create AOI/candidate schema with geometry and versioned features.
- [ ] [TASK:P26-002] Index by mission profile, geography, environment and coverage.
- [ ] [TASK:P26-003] Mark known benchmark sites separately from novel-to-catalog candidates.

## Dependencies
- `25-geospatial-normalization-and-tiling.md`
- `30-similarity-scoring-engine.md`

## Acceptance criteria
- [ ] Candidate query returns stable IDs and evidence lineage.
- [ ] Known analog catalogue is separated from new scan output.

## Anti-slop alignment
core R-17 and source evidence principles.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
