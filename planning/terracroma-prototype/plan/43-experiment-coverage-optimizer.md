# Experiment coverage optimizer

**Purpose:** Map experiments to conditions and candidate site capabilities, revealing uncovered and facility-only tests.

## Scope
### In scope
- Implement the experiment coverage optimizer capability: Map experiments to conditions and candidate site capabilities, revealing uncovered and facility-only tests.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Create experiment catalog with required conditions.; Score site-condition coverage with evidence thresholds.; Compute uncovered conditions and information gaps.

### Out of scope
- Upstream capabilities owned by: 41-analog-transferability-intelligence.md, 30-similarity-scoring-engine.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P43-001] Create experiment catalog with required conditions.
- [ ] [TASK:P43-002] Score site-condition coverage with evidence thresholds.
- [ ] [TASK:P43-003] Compute uncovered conditions and information gaps.
- [ ] [TASK:P43-004] Allow user-defined experiment priorities.

## Dependencies
- `41-analog-transferability-intelligence.md`
- `30-similarity-scoring-engine.md`

## Acceptance criteria
- [ ] Optimizer reports covered, partial, uncovered and unverified rows.
- [ ] Weights/requirements are visible and editable.

## Anti-slop alignment
human: explicit labels; core: unknown not match; copywriting plain claims.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
