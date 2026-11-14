# Component catalog and acceptance tests

**Purpose:** Provide a traceable catalog of every application component and map each to data contracts, plan documents and acceptance tests.

## Scope
### In scope
- Core workflow requirements, component interfaces and cross-component quality tests

### Out of scope
- Duplicate design specifications already owned by component plans

## Tasks
- [ ] [TASK:P21-001] Maintain the component-to-plan traceability table.
- [ ] [TASK:P21-002] Define cross-component end-to-end acceptance tests.
- [ ] [TASK:P21-003] Track MVP vs deferred component status.
- [ ] [TASK:P21-004] Verify no component uses unlabelled synthetic data.

## Dependencies
- `04-architecture.md`
- `17-validation-testing-and-scientific-integrity.md`

## Acceptance criteria
- [ ] All visible features have one owner plan and test ID.
- [ ] Cross-component flows can be run end to end.
- [ ] Deferred components are not represented as completed.

## Anti-slop alignment
antislop core R-24/R-26: every control has a real behavior; human skill: controls have state and labels.

## Estimated effort
M

## Status
**Status:** Not started

### Cross-component traceability
| Challenge/product need | Plan ownership | UI surface | Evidence/data | Acceptance
|---|---|---|---|
| Discover new terrestrial analogs | 11, 22–26, 29–30 | Candidate map/list | SRTM, HLS, optional EMIT | DISC-001 / INDEX-001 |
| Characterize geology and terrain | 08, 23–25, 29 | Layers and candidate profile | DEM, optical and mineral products | FEAT-001 |
| Compare Moon/Mars targets | 24, 28, 30–32 | Planetary target selector + comparison | MOLA/LOLA/CTX/CRISM/Diviner | TARGET-001 |
| Show irreducible differences | 10, 41 | Gap/transferability panel | Mission physics references, PDS target metadata | TRANS-001 |
| Mission-specific experiment choice | 12, 27, 43 | Profile editor and coverage planner | Site features + experiment condition catalog | COVER-001 |
| 3D terrain and rehearsal | 13–14, 33–36 | Map, 3D and route rehearsal | DEM/WMTS layers | ROUTE-001 |
| New signature insight | 40–46 | Timeline, site network, coverage and scenario lab | HLS and curated measurements | TIME-001 / NETWORK-001 |
| Research-grounded answer | 37–39, 41 | Research Lab and source panel | User-supplied papers + cited corpus | RAG-001 |

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
