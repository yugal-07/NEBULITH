# Counterfactual mission lab

**Purpose:** Let users test how alternate mission weights, rover constraints or candidate-site combinations change recommendations.

## Scope
### In scope
- Implement the counterfactual mission lab capability: Let users test how alternate mission weights, rover constraints or candidate-site combinations change recommendations.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Create isolated scenario config copies.; Vary profile weights and documented rover envelopes.; Recompute score/coverage/route using deterministic engines.

### Out of scope
- Upstream capabilities owned by: 30-similarity-scoring-engine.md, 36-rover-route-planner.md, 43-experiment-coverage-optimizer.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P46-001] Create isolated scenario config copies.
- [ ] [TASK:P46-002] Vary profile weights and documented rover envelopes.
- [ ] [TASK:P46-003] Recompute score/coverage/route using deterministic engines.
- [ ] [TASK:P46-004] Compare baseline vs scenario and show changed assumptions.

## Dependencies
- `30-similarity-scoring-engine.md`
- `36-rover-route-planner.md`
- `43-experiment-coverage-optimizer.md`

## Acceptance criteria
- [ ] Scenarios never overwrite baseline research.
- [ ] Changed assumptions and changed ranking are visible.

## Anti-slop alignment
antislop-ui: interactive controls must function; human: field labels and state feedback.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
