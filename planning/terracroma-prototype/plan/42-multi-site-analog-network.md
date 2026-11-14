# Multi-site analog network

**Purpose:** Select complementary sites that collectively cover more mission experiments than any single site.

## Scope
### In scope
- Implement the multi-site analog network capability: Select complementary sites that collectively cover more mission experiments than any single site.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Define experiment-condition coverage matrix.; Implement greedy set cover or transparent weighted coverage optimization.; Show marginal coverage gained by each additional site.

### Out of scope
- Upstream capabilities owned by: 43-experiment-coverage-optimizer.md, 26-analog-candidate-index.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P42-001] Define experiment-condition coverage matrix.
- [ ] [TASK:P42-002] Implement greedy set cover or transparent weighted coverage optimization.
- [ ] [TASK:P42-003] Show marginal coverage gained by each additional site.
- [ ] [TASK:P42-004] Expose travel/logistics as optional, separately sourced constraint.

## Dependencies
- `43-experiment-coverage-optimizer.md`
- `26-analog-candidate-index.md`

## Acceptance criteria
- [ ] Chosen sites and coverage tradeoffs are explainable.
- [ ] No claim that site collection reproduces full planet environment.

## Anti-slop alignment
core C-3: optimize for experiment decisions; UI charts show coverage not decorative totals.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
