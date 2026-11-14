# Mission profile editor

**Purpose:** Let a researcher define an experiment-specific profile with editable conditions, importance weights and hard constraints.

## Scope
### In scope
- Implement the mission profile editor capability: Let a researcher define an experiment-specific profile with editable conditions, importance weights and hard constraints.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Define rover mobility, EVA geology, drilling, habitat and solar test presets.; Add editable criterion weights with validation.; Distinguish mandatory constraints from preferences.

### Out of scope
- Upstream capabilities owned by: 12-mission-specific-matching.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P27-001] Define rover mobility, EVA geology, drilling, habitat and solar test presets.
- [ ] [TASK:P27-002] Add editable criterion weights with validation.
- [ ] [TASK:P27-003] Distinguish mandatory constraints from preferences.

## Dependencies
- `12-mission-specific-matching.md`

## Acceptance criteria
- [ ] Profile saves versioned criteria and visibly updates ranking.
- [ ] Constraints and weights are inspectable.

## Anti-slop alignment
human: labels/help/error states; copywriting: plain-language parameter descriptions.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
