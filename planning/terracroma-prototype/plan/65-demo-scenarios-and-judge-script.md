# Demo Scenarios and Judge Script

**Purpose:** Deliver one repeatable story that demonstrates the challenge objective, scientific integrity and differentiated workflow.

## Scope
### In scope
- One primary mission story, backup path, source/provenance checkpoints and a 4–6 minute demo.
### Out of scope
- Claims that all global analog sites were scanned or that cached results were computed live.

## Primary scenario: Mars rover geology and mobility rehearsal
1. Open a prepared study with a verified Mars target AOI.
2. Choose `Rover mobility + geological sampling`.
3. Run candidate discovery over two or three curated Earth AOIs.
4. Inspect candidate score dimensions, coverage and source lineage.
5. Compare a strong match and a mismatch in Comparison Studio.
6. Show why Earth cannot reproduce gravity, vacuum/atmosphere and radiation conditions.
7. Select route waypoints on one Earth AOI and calculate a terrain-proxy route.
8. Inspect warnings and assumptions, not a safety guarantee.
9. Generate a report with rankings, evidence, gaps and recommended field measurements.

## Novelty moment
Show that one site may not cover every experiment. Add a complementary site and show experiment coverage (stretch if time allows). Explain that Terracroma optimizes an experiment portfolio, not a simplistic Mars twin score.

## Backup path
- If external services fail, switch to a cached snapshot with a persistent `CACHED DEMO DATA` banner.
- If a layer has no coverage, show `DATA UNAVAILABLE`; never substitute fake measurements.
- If 3D fails, retain 2D map, elevation profile and route table.

## Judge questions
- How is similarity computed and explained?
- How are missing data and resolution differences handled?
- What can Earth experiments validate?
- How is AI prevented from inventing scientific facts?
- How can curated discovery scale globally?
- What differentiates the integrated workflow?

## Tasks
- [ ] [TASK:DEMO-001] Freeze target, candidate AOIs, mission profile and source manifest.
- [ ] [TASK:DEMO-002] Cache and verify all demo data before event.
- [ ] [TASK:DEMO-003] Rehearse full workflow with stopwatch.
- [ ] [TASK:DEMO-004] Prepare backup recording and offline demo state.
- [ ] [TASK:DEMO-005] Prepare answers about novelty, limitations, sources and scoring.

## Dependencies
- `19-hackathon-demo-and-pitch.md`
- `62-hackathon-mvp-build-specification.md`
- `63-screen-by-screen-ui-specification.md`
- `17-validation-testing-and-scientific-integrity.md`
- `61-scientific-report-export-generator.md`

## Acceptance criteria
- Full demo runs in 4–6 minutes without live source editing.
- Every value is sourced or visibly labelled as a demo fixture.
- Offline path is tested and does not imply unavailable features worked.

## Anti-slop alignment
- antislop R-17/R-36: no fake metrics or unsupported claims.
- antislop delivery gate: every shown control works.
- UI UX Pro Max: readable information hierarchy.

## Estimated effort
M

## Status
**Status:** Not started
