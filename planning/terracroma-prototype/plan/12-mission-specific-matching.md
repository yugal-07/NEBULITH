# Mission-specific matching

**Purpose:** Allow scientists to rank locations for a specific experiment or mission profile, not a vague all-purpose “Mars likeness”.

## Scope
### In scope
- Rover mobility, EVA field geology, drilling, habitat test, solar/illumination and instrument deployment profiles
- Editable weights and hard eligibility constraints

### Out of scope
- One universal ranking for every mission
- Unvalidated safety or equipment certification

## Tasks
- [ ] [TASK:P12-001] Define versioned mission profiles with measurable parameters.
- [ ] [TASK:P12-002] Separate hard exclusions from soft weighted preferences.
- [ ] [TASK:P12-003] Expose ranking changes as weights/requirements change.
- [ ] [TASK:P12-004] Connect the profile to multi-site experiment coverage.

## Dependencies
- `09-scientific-model-and-scoring.md`
- `30-similarity-scoring-engine.md`

## Acceptance criteria
- [ ] At least three profiles produce meaningfully different, explainable results on verified data.
- [ ] Hard constraints are distinguished from preferences.
- [ ] User can inspect all weights and assumptions.

## Anti-slop alignment
antislop core: only display controls with real behavior; human skill: labelled controls and keyboard access.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
