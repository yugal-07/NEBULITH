# Antigravity Implementation Backlog

## Operating instruction
Build one vertical slice and prove it before expanding. Each task below maps to the detailed plan task IDs. Do not mark a plan checkbox until code and tests exist.

## Sprint 0 — Bootstrap and freeze data (first 2–3 hours)
1. Inspect the repository and create `frontend/`, `backend/`, `data/`, `docs/` only after confirming no existing implementation is present.
2. Confirm Anti-Slop DURING/AFTER mode with the user before UI implementation if unresolved.
3. Verify a single Mars target AOI and two or three Earth AOIs using the official product landing pages and source manifest.
4. Cache the smallest useful AOI extracts; preserve source metadata, units, CRS, resolution, date, license and checksums.
5. Implement health endpoint and frontend/backend dev startup.

Relevant plans: `04`, `05`, `08`, `16`, `22`–`25`, `64`, `67`.

## Sprint 1 — Scientific vertical slice (next 5–7 hours)
1. Define typed feature/evidence schema.
2. Preprocess Earth DEM and planetary target context into compatible feature summaries, preserving non-comparability.
3. Implement normalized dimension scoring with configurable weights, missing-data coverage and deterministic output.
4. Add per-dimension evidence and provenance.
5. Implement candidate discovery for the curated set.

Relevant plans: `09`, `10`, `11`, `12`, `29`–`32`, `51`, `64`.

## Sprint 2 — Interactive experience (next 5–7 hours)
1. Build app shell and Mission Workspace.
2. Add 2D map, target AOI selector and candidate pins.
3. Add comparison screen and transferability matrix.
4. Add one Three.js DEM terrain scene from a preprocessed local heightfield.
5. Add loading, unavailable, partial-coverage and cached-demo states.

Relevant plans: `15`, `33`, `34`, `54`, `60`, `63`.

## Sprint 3 — Mission rehearsal and tangible output (next 4–6 hours)
1. Implement a bounded rover route cost function using slope/roughness penalties and explicit thresholds from the team's documented assumptions.
2. Display route alternatives, warnings and assumptions; never call it a safety result.
3. Generate reproducible HTML/PDF report and CSV/GeoJSON exports.
4. Run acceptance tests and fix P0/P1 defects.

Relevant plans: `14`, `35`, `36`, `61`, `66`.

## Sprint 4 — Demo hardening (final 2–3 hours)
1. Cache all required data and test with network disabled.
2. Run the 4–6 minute judge script.
3. Prepare backup recording and exported report.
4. Deploy only if it is reliable; local demo remains fallback.

Relevant plans: `19`, `65`, `66`, `67`.

## Do not start before MVP passes
- Full autonomous agent orchestration.
- Full global analog scanning.
- Full cave/subsurface mapping.
- EVA/habitat workload modelling.
- Climate trend prediction.
- XR/VR.
- High-fidelity physics.
