# Earth–Moon–Mars gap matrix component

**Purpose:** Present transferable, partially transferable, non-transferable and unknown condition rows for a selected mission.

## Scope
### In scope
- Implement the earth–moon–mars gap matrix component capability: Present transferable, partially transferable, non-transferable and unknown condition rows for a selected mission.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Build matrix with condition, Earth proxy, target value/range, transfer status and rationale.; Add facility/intervention recommendations where supported.; Show gravity, vacuum and radiation as irreducible/facility-dependent.

### Out of scope
- Upstream capabilities owned by: 10-earth-moon-mars-gap-engine.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P32-001] Build matrix with condition, Earth proxy, target value/range, transfer status and rationale.
- [ ] [TASK:P32-002] Add facility/intervention recommendations where supported.
- [ ] [TASK:P32-003] Show gravity, vacuum and radiation as irreducible/facility-dependent.

## Dependencies
- `10-earth-moon-mars-gap-engine.md`

## Acceptance criteria
- [ ] Gap states have text and icons, not hue alone.
- [ ] Irreducible conditions are never scored as Earth field matches.

## Anti-slop alignment
human skill: color-only feedback forbidden; core evidence over claims.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
