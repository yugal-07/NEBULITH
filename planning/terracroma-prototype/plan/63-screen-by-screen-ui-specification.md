# Screen-by-Screen UI Specification

**Purpose:** Give Antigravity explicit screen structure, interactions and states for a coherent scientific workbench.

## Scope
### In scope
- Seven primary screens, shared navigation and responsive desktop/tablet/mobile states.
- Loading, empty, error, no-coverage, demo-fixture and populated states.
- Keyboard alternatives for map-only interactions.
### Out of scope
- Decorative metrics, fake telemetry, placeholder testimonials, inert controls or dead navigation.

## Navigation
1. Mission Workspace
2. Planetary Explorer
3. Analog Discovery
4. Comparison Studio
5. Transferability
6. Mission Rehearsal
7. Reports

Use a persistent left rail on wide screens and compact menu on narrow screens. Header shows active study, target body/region, data status and save/export actions. Never show fake live/online status.

## Screen specifications
### 1. Mission Workspace
Study summary, target, mission profile, candidate set and data readiness. Actions: create, open demo, continue. Empty and loaded states required.
### 2. Planetary Explorer
Interactive globe/map, body selector, layer catalog, coordinate/AOI tools and metadata drawer. AOI selection persists into discovery. Unsupported/no-coverage layers are explicit.
### 3. Analog Discovery
Candidate map/list, mission profile, weight controls, score breakdown and coverage. Actions: run, filter, pin, inspect. Scores come from deterministic service.
### 4. Comparison Studio
Synchronized map/imagery panels, dimension rows, metadata and uncertainty. Prevent invalid cross-sensor differencing.
### 5. Transferability Intelligence
Conditions grouped as transferable, partial, non-transferable or unknown, with rationale and complementary facility/test. Do not hide gravity, vacuum/atmosphere or radiation gaps in one score.
### 6. Mission Rehearsal
Terrain viewer, start/end points, route alternatives, slope/roughness warnings, checkpoints and assumptions. No certified safety language.
### 7. Reports
Preview, source manifest, methodology, score breakdown, limitations and export actions for PDF/HTML, CSV and GeoJSON.

## Visual direction
Deep-space navy/near-black surfaces, blue as structural color, restrained lime/yellow for selected actions and critical evidence states. Map colors encode scientific meaning. Use field-science cartography: contours, grid references, observation markers and evidence lineage. Avoid generic glass dashboards and gratuitous glow.

## Tasks
- [ ] [TASK:UI-001] Implement responsive route/navigation shell.
- [ ] [TASK:UI-002] Implement Mission Workspace and study actions.
- [ ] [TASK:UI-003] Implement Planetary Explorer with AOI and metadata drawer.
- [ ] [TASK:UI-004] Implement Analog Discovery ranking and explanation.
- [ ] [TASK:UI-005] Implement Comparison Studio and Transferability screens.
- [ ] [TASK:UI-006] Implement Mission Rehearsal and Reports screens.
- [ ] [TASK:UI-007] Implement loading/error/unknown/demo states and keyboard alternatives.
- [ ] [TASK:UI-008] Review wide, tablet and mobile visual/accessibility behavior.

## Dependencies
- `05-tech-stack.md`
- `15-frontend-experience-and-design-system.md`
- `33-2d-map-and-layer-control.md`
- `34-3d-terrain-viewer.md`
- `54-design-system-integration.md`
- `60-scientific-comparison-studio.md`
- `61-scientific-report-export-generator.md`

## Acceptance criteria
- All seven screens are navigable and interactive.
- No visible button is inert.
- All scientific values show units and evidence state.
- Narrow layouts reflow rather than shrink desktop layout.
- Keyboard users can complete core workflow.

## Anti-slop alignment
- antislop R-03/R-17/R-26/R-35: responsive, sourced, functional and tested UI.
- antislop-layoutmobile: content-driven responsive layout.
- antislop-accessibility: names, focus, contrast, reduced motion and non-map alternatives.
- UI UX Pro Max: screen hierarchy and stack-specific implementation.

## Estimated effort
L

## Status
**Status:** Not started
