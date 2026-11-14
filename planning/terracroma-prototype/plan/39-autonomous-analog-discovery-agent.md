# Autonomous analog discovery agent

**Purpose:** Orchestrate a constrained research workflow that proposes candidate regions and creates a cited dossier for human review.

## Scope
### In scope
- Implement the autonomous analog discovery agent capability: Orchestrate a constrained research workflow that proposes candidate regions and creates a cited dossier for human review.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Define tool allowlist: data search, feature scan, literature retrieval, report creation.; Use structured intermediate state and task IDs.; Require deterministic scorer for candidate ranking.

### Out of scope
- Upstream capabilities owned by: 11-global-analog-discovery.md, 37-research-rag-and-paper-assistant.md, 30-similarity-scoring-engine.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P39-001] Define tool allowlist: data search, feature scan, literature retrieval, report creation.
- [ ] [TASK:P39-002] Use structured intermediate state and task IDs.
- [ ] [TASK:P39-003] Require deterministic scorer for candidate ranking.
- [ ] [TASK:P39-004] Require human approval before promoting candidate claims.

## Dependencies
- `11-global-analog-discovery.md`
- `37-research-rag-and-paper-assistant.md`
- `30-similarity-scoring-engine.md`

## Acceptance criteria
- [ ] Agent action log is inspectable and reproducible.
- [ ] LLM cannot fabricate data, score candidates or bypass validation gates.

## Anti-slop alignment
core R-17/R-36; code skill comment hygiene; copywriting no buzzwords.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
