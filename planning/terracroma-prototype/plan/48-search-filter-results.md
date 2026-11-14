# Search, filters and candidate results

**Purpose:** Make global and AOI-bounded candidate discovery usable with transparent filters and ranking context.

## Scope
### In scope
- Implement the search, filters and candidate results capability: Make global and AOI-bounded candidate discovery usable with transparent filters and ranking context.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Search names, coordinates, geology tags and candidate IDs.; Filter by body, terrain type, mission profile and evidence coverage.; Sort by score, coverage, novelty-to-catalog and data freshness.

### Out of scope
- Upstream capabilities owned by: 26-analog-candidate-index.md, 30-similarity-scoring-engine.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P48-001] Search names, coordinates, geology tags and candidate IDs.
- [ ] [TASK:P48-002] Filter by body, terrain type, mission profile and evidence coverage.
- [ ] [TASK:P48-003] Sort by score, coverage, novelty-to-catalog and data freshness.
- [ ] [TASK:P48-004] Show empty/loading/error states.

## Dependencies
- `26-analog-candidate-index.md`
- `30-similarity-scoring-engine.md`

## Acceptance criteria
- [ ] Every filter has a real result effect.
- [ ] List and map selection stay synchronized.

## Anti-slop alignment
human skill: empty/loading/error; UI UX navigation and form priority.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
