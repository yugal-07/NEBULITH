# Astronaut EVA and Habitat Operations

**Purpose:** Add bounded planning for EVA routes, habitat-to-worksite logistics and environmental work-window proxies.

## Scope
### In scope
- Waypoint-based EVA route sketches over terrain layers.
- Illumination/daylight and terrain workload proxies when source data support them.
- Distance, slope exposure, route alternatives and habitat logistics.
### Out of scope
- Medical, physiological, life-support or astronaut safety certification.
- Fatigue prediction without validated human-factors data.

## Tasks
- [ ] [TASK:EVA-001] Define EVA planning inputs, outputs and prohibited safety claims.
- [ ] [TASK:EVA-002] Define supported illumination and terrain workload proxy fields.
- [ ] [TASK:EVA-003] Implement waypoint, route and worksite planning DTOs.
- [ ] [TASK:EVA-004] Add EVA route view with distance, slope exposure and evidence coverage.
- [ ] [TASK:EVA-005] Add proxy/unknown labels and tests for unsupported physiological claims.

## Dependencies
- `04-architecture.md`
- `09-scientific-model-and-scoring.md`
- `13-geospatial-3d-digital-twin.md`
- `14-mission-rehearsal-simulator.md`
- `36-rover-route-planner.md`

## Acceptance criteria
- EVA planning is labelled a planning aid, not safety approval.
- Environmental values include units and source metadata.
- Workload is described only as a terrain/operational proxy.
- Missing data disables affected calculations visibly.

## Anti-slop alignment
- antislop core R-17: no invented human-performance statistics.
- antislop core R-03: controls reflow on mobile.
- UI UX Pro Max accessibility: map information also appears in semantic text/list form.

## Estimated effort
M

## Status
**Status:** Not started
