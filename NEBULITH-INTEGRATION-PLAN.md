# NEBULITH ? Terracroma Integration Plan

Audit date: 2026-11-14. The user's pasted integration prompt is the task; package instructions are project specifications interpreted under it and existing NEBULITH design authority.

## Phase 0: baseline and package audit

### Preserved baseline
- React 19, TypeScript 5.7, Vite 6, React Router 7, React Three Fiber 9, Drei 10, Three.js 0.187 and Lucide 1.73.
- `src/App.tsx` owns route-level state; `AppShell` top navigation; `Overview` explorer; `PlanetaryGlobe` and `GlobeControls` 3D; `WorkspacePage` generic stub; `StarfieldBackground` and `src/styles.css` visual shell; `src/data/locations.ts` demo locations.
- Existing routes: `/`, `/explore`, `/discover`, `/research`, `/compare`, `/analyze`, `/reports`. Keep compatible. Interactions include planet switch, demo place/coordinate search, globe point select, rotate/zoom/reset/orientation, grid and Earth-cloud toggles, display/high contrast, route navigation and location context. Elevation/slope are explicitly not connected.
- Local Earth day/cloud, Moon and Mars textures in `public/textures` are illustrative only. No scientific rasters/vectors, AOI model, MapLibre view, FastAPI API, persistence, report export, source catalog, scoring or ingestion pipeline.
- Baseline `npm.cmd run build` passed; Three.js chunk is about 753 kB minified before gzip and async-loaded. HTTP smoke check to `http://127.0.0.1:5173/` returned 200. Browser console/UI automation unavailable in baseline.
- Temporary pre-change backup: `C:\Users\techy\AppData\Local\Temp\NEBULITH-baseline-298cf552491449a3a862efdc10ab50ad.zip`. No root Git repository detected.

### Package audit
The ZIP is a planning/specification repository, not application source. It contains 68 plan documents and 311 unique `[TASK:...]` IDs. Progress state is 0/311 (0%). Its alignment audit is stale (57 plans/230 tasks); current plans, README and progress state agree on 68/311. Use current plans/IDs, not stale totals. The untouched package is preserved at `planning/terracroma-prototype/`, including plans, progress system, scripts, tests, research and instructions. The point-in-time source audit has unresolved product/coverage caveats; verify providers, versions, coverage, licensing and access before ingestion. No real data bundle or backend was supplied.

### Reconciliation decisions
- Screenshot/current shell governs visual layout; do not add permanent left rail. Analyze gets contextual subnavigation.
- Keep old routes, add `/workspace`, `/explorer`, `/discovery`, `/comparison`, `/transferability`, `/rehearsal`. Preserve `/discover` and `/compare`; Workspace button goes to `/workspace`.
- Keep global globe, MapLibre 2D map/AOI and bounded DEM 3D scene as distinct products.
- Implement only evidence-backed controls; no empty advanced modules.
- Local-first FastAPI monolith, SQLite and local files; PostGIS can be later. Credentials stay server side.
- Evidence has nullable values plus units, evidence type, coverage, source, resolution, time range, uncertainty and processing version. Missing is never zero.
- Deterministic versioned scoring stays separate from LLM narrative. Do not compare incompatible raw sensors. Earth cannot recreate lunar/martian gravity, vacuum, radiation or other irreducible conditions. Route output is not safety certification. Do not imply NASA endorsement.

## Dependency-ordered phases
| Phase | Scope | Priority | Exit evidence |
|---:|---|---|---|
| 0 | Audit, preservation, design reconciliation, mapping | Governance | Baseline + complete 68/311 mapping; source preserved |
| 1 | Design tokens, accessible shell, route aliases, Analyze navigation | Foundation | Existing composition retained; old routes resolve; no blank features |
| 2 | Workspace/AOI model, target selection, MapLibre 2D shell | P0 | Valid geometry; distinct globe; layers identify source/coverage |
| 3 | FastAPI, SQLite/files, API contracts, source registry, verified target ingest | P0 | Health/contracts, persistence, provenance, data source verification |
| 4 | Curated candidates, comparable features, deterministic matching, transferability | P0 | 2?3 vetted AOIs, nullable evidence, explainable reproducible result |
| 5 | One DEM scene, bounded hazards, one route profile | P1 | Real cached DEM, vertical reference, route caveat |
| 6 | Source-grounded research ingestion and comparison | P1 | Citation traceability, comparable units/context |
| 7 | Saved workspace, reproducible reports and CSV/GeoJSON | P1 | Export regenerated from saved/versioned study |
| 8 | P2/P3 roadmap: resource proxies, multi-site, agent, time machine, counterfactuals, caves, EVA, degradation, XR, global scanning, auth, high-fidelity physics | Deferred | Begin after P0/P1 and separate data/physics validation |
| 9 | Acceptance validation, demo, security/deployment operations | Cross-cutting | Run relevant acceptance checks; update only evidenced tasks |

Priority matrix follows source package: P0 mission workspace/target, curated discovery, deterministic matching, evidence/provenance, transferability, 2D AOI map, one real DEM; P1 route rehearsal, comparison, report and CSV/GeoJSON; P2 resource proxy, multi-site, agent, time machine, counterfactual; P3 caves, EVA/habitat, degradation, XR, full global scanning, auth and high-fidelity physics. All 68 plan docs and 311 task IDs have canonical phases in `NEBULITH-FEATURE-MAPPING.md`.

## API and data boundary
Canonical contracts: `GET /health`, `GET /api/v1/sources`, `GET /api/v1/targets?body=...`, CRUD `/api/v1/studies`, plus study-scoped discovery, candidates, compare, transferability, routes, reports and exports. Types include `EvidenceValue`, `Candidate`, `Study`, `TransferabilityCondition`, and `RouteResult` with `not_a_safety_certification=true`. Use one modular monolith, not microservices.

## Validation and progress protocol
At phase boundaries run applicable build/acceptance checks and inspect outputs. Leave task checkboxes unchecked until that exact task has implementation and acceptance evidence. Use package updater `--check` for read-only verification; inspect updater/hooks before mutating progress. Do not install hooks or deploy/publish as part of local work.

## Current execution status
- **Phase 0 complete:** baseline and archive preserved; design reconciliation and all-plan/task mapping written. Anti-Slop mode selected: **DURING + AFTER**.
- **Phase 1 in progress:** added a local mission workspace view, routes `/workspace`, `/explorer`, `/discovery`, `/comparison`, `/transferability`, `/rehearsal`; preserved existing route names; Workspace control now opens `/workspace`. Other advanced routes remain clearly staged until their data/workflows exist.
- **Phase 3 foundation in progress:** added FastAPI/Pydantic contracts, SQLite CRUD for studies, structured errors, OpenAPI, source/target status responses, and Vite API proxy. No candidate scores or environmental results are generated without configured products. A complete source ingest and remaining route contracts are still outstanding.
- **Running locally:** frontend `http://127.0.0.1:5173/`; API `http://127.0.0.1:8000/`; docs `http://127.0.0.1:8000/docs`. The workspace can create and list studies. Scientific sources/targets report `not_configured`.
- **Checks:** `npm.cmd run build` passes; 6 backend contract tests pass; preserved package `scripts/update_progress.py --check` reports artifacts current; live HTTP checks return 200 for `/workspace` and `/health`, and the frontend proxy reaches the API.
- Package progress remains **0/311** because the source plan tasks include broader acceptance criteria not yet satisfied by this foundation.

## Open gates
DEM, AOI source and candidates are absent from ZIP, so verify and cache bounded real data before scientific maps or numbers are presented. Visual browser automation is unavailable in this environment; rendered UI was not visually inspected, though route and proxy HTTP checks passed. The existing Three.js chunk-size build warning remains (about 753 kB minified).
