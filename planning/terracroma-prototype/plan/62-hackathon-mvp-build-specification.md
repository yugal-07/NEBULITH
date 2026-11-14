# Hackathon MVP Build Specification

**Purpose:** Convert the broad roadmap into one coherent, judge-operable 24–48 hour prototype.

## Scope
### In scope
- One planetary target AOI and two or three curated Earth analog candidates.
- Real source-backed inputs where available; synthetic fixtures only for UI states and always labelled.
- Deterministic explainable scoring, missing-data handling, 2D map, one focused 3D terrain scene, transferability panel, bounded rover route rehearsal and report export.
- Local-first operation with optional public deployment.
### Out of scope
- Global all-pixel scanning, full climate forecasting, detailed rover physics, broad cave discovery, XR, accounts and production multi-tenant operations.
- Claiming a complete global analog database.

## Product promise
A judge selects a Moon/Mars target, chooses an experiment profile, compares curated Earth candidates, inspects evidence and irreducible gaps, rehearses a route and exports a cited mission brief.

## Demo configuration
- Target: one Mars AOI with a verified planetary terrain product. Gale Crater is a proposed story target, not a fixed choice; verify coverage and product scale before selection.
- Earth candidates: two or three curated AOIs such as Atacama, Ladakh/Spiti or volcanic basalt terrain, only where chosen datasets provide actual coverage.
- Mission: rover mobility plus geological sampling. EVA, drilling and habitat profiles remain future/stretched unless data are ready.
- Earth terrain: one verified DEM; derive slope/roughness with documented algorithms.
- Planetary context: one verified elevation/imagery product. Do not compare raw pixels from different sensors as equivalent.

## Tasks
- [ ] [TASK:MVP-001] Freeze target AOI, candidate AOIs and verified products in a source manifest.
- [ ] [TASK:MVP-002] Implement target-to-report end-to-end user journey.
- [ ] [TASK:MVP-003] Show observed/derived/unknown state and provenance for each dimension.
- [ ] [TASK:MVP-004] Implement one mission profile and configurable deterministic weights.
- [ ] [TASK:MVP-005] Implement transferability/gap view for gravity, atmosphere, radiation, thermal, geology and mobility.
- [ ] [TASK:MVP-006] Implement interactive 2D map and one real 3D terrain scene.
- [ ] [TASK:MVP-007] Implement bounded rover route rehearsal using documented terrain proxies.
- [ ] [TASK:MVP-008] Implement cited report plus CSV/GeoJSON exports.
- [ ] [TASK:MVP-009] Add offline cached mode and visible `CACHED DEMO DATA`/`DEMO FIXTURE` labels.
- [ ] [TASK:MVP-010] Complete judge workflow and critical acceptance tests.

## Dependencies
- `01-project-overview.md`
- `04-architecture.md`
- `05-tech-stack.md`
- `08-data-sources-and-ingestion.md`
- `09-scientific-model-and-scoring.md`
- `11-global-analog-discovery.md`
- `12-mission-specific-matching.md`
- `13-geospatial-3d-digital-twin.md`
- `14-mission-rehearsal-simulator.md`
- `17-validation-testing-and-scientific-integrity.md`
- `60-scientific-comparison-studio.md`
- `61-scientific-report-export-generator.md`

## Acceptance criteria
- Fresh clone starts locally using documented commands.
- Judge completes primary workflow without developer intervention.
- No fabricated values are shown as measured data.
- Every score expands into dimensions and evidence.
- Map, 3D scene, transferability and route rehearsal are interactive.
- Exports include methodology, sources, units, uncertainty and limitations.
- External source failure does not break demo; cached fixtures are visibly labelled.

## Anti-slop alignment
- antislop core: purposeful UI, no fake metrics, no dead controls, run Delivery Gate.
- antislop-layoutmobile: responsive reflow.
- antislop-code: comments preserve non-obvious scientific constraints.
- UI UX Pro Max: accessible patterns and meaningful scientific visualization.

## Estimated effort
L

## Status
**Status:** Not started
