# Explainability and evidence panel

**Purpose:** Explain each candidate's strongest matches, weak matches, unknown dimensions and source provenance.

## Scope
### In scope
- Implement the explainability and evidence panel capability: Explain each candidate's strongest matches, weak matches, unknown dimensions and source provenance.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Show per-dimension raw/normalized evidence and method.; Show confidence/coverage components.; Link source product and processing version.

### Out of scope
- Upstream capabilities owned by: 30-similarity-scoring-engine.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P31-001] Show per-dimension raw/normalized evidence and method.
- [ ] [TASK:P31-002] Show confidence/coverage components.
- [ ] [TASK:P31-003] Link source product and processing version.
- [ ] [TASK:P31-004] Include “why not equivalent” explanation.

## Dependencies
- `30-similarity-scoring-engine.md`

## Acceptance criteria
- [ ] Every displayed explanation resolves to a measurement/source or is labelled as a hypothesis.
- [ ] No generic LLM rationale can change computed score.

## Anti-slop alignment
copywriting: claims need evidence; human: text alternatives for status colors.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
