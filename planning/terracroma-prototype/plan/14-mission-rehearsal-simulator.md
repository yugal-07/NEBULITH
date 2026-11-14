# Mission rehearsal simulator

**Purpose:** Define a transparent terrain and route rehearsal that helps teams inspect route constraints and candidate-specific hazards.

## Scope
### In scope
- Rover/astronaut route sketching, slope and roughness indicators, obstacle overlays and checkpoint notes
- Scenario settings and mission rehearsal outputs

### Out of scope
- Physics-accurate rover dynamics in MVP
- Autonomous safety guarantees or human EVA medical advice

## Tasks
- [ ] [TASK:P14-001] Implement 2D route and terrain sampling over a bounded AOI.
- [ ] [TASK:P14-002] Add configurable slope/roughness thresholds with source and units.
- [ ] [TASK:P14-003] Calculate distance and simple terrain penalty; label model assumptions.
- [ ] [TASK:P14-004] Provide route alternatives and warnings.
- [ ] [TASK:P14-005] Store rehearsal config with evidence snapshot.

## Dependencies
- `35-terrain-hazard-analysis.md`
- `36-rover-route-planner.md`
- `46-counterfactual-mission-lab.md`

## Acceptance criteria
- [ ] A reviewer can trace every warning to a raster value or model assumption.
- [ ] A route with missing terrain is marked unknown, not safe.
- [ ] Simulator clearly states non-certified status.

## Anti-slop alignment
antislop core R-17: no fake telemetry; human skill: feedback states; UI UX Pro Max: interaction feedback and performance.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
