# Terracroma.ai idea-alignment and novelty audit

**Audit date:** 2026-11-14  
**Scope reviewed:** all 57 `plan/*.md` files in `Terracroma.ai-project.zip`, project root instructions, research source audit, progress artifacts, updater, tests and workflow; the four NASA Space Apps poster/feature screenshots supplied in the conversation; and the uploaded `Terracroma.ai — Complete Feature List` document.

## Executive verdict

**The package is directionally aligned with the challenge and the supplied product concept, but it is not yet a complete one-to-one implementation specification for every feature in the supplied list.** The main challenge workflow and the five features shown in the screenshot are represented. The broader Terracroma feature list is mostly represented across multiple files, but several areas are only implicit or deferred, and some important challenge dimensions need dedicated components.

The package is a planning repository, not an implemented application. The 230 implementation tasks are unchecked, so the dashboard correctly starts at 0%.

## 1. Challenge alignment

The official challenge statement asks teams to use open Earth, Moon and Mars data from NASA and other space agencies to identify and characterize new terrestrial analogs for future bases or landing sites. It explicitly names topography, geology, environment and available resources; asks teams to consider deserts, polar regions, volcanic and arid terrains, caves and other similar environments; and requests a map, visualization or other tool.

Official source: https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/

| Official challenge need | Current plan coverage | Audit |
|---|---|---|
| Use open Earth, Moon and Mars data | `08`, `22`–`25` | Covered at architecture/data-catalog level. Specific resource-tab datasets still need verification. |
| Identify new analog locations, not only famous examples | `11`, `26`, `48` | Covered. `11` explicitly distinguishes known sites from new-to-catalog candidates and scopes MVP scanning to a bounded AOI. |
| Characterize topography | `13`, `29`, `34`, `35` | Covered. |
| Characterize geology/mineralogical indicators | `08`, `23`, `24`, `29` | Partially covered. Mineral indicators are planned; a proper resource prospecting/geological context component is missing. |
| Characterize environmental conditions | `08`, `09`, `29`, `40`, `45` | Covered in principle, subject to compatible data and temporal coverage. |
| Characterize available resources | `08`, `12`, `27` | **Gap.** Solar/illumination appears as a mission profile, and mineralogy appears in the feature pipeline, but there is no dedicated resource/ISRU proxy component or explicit water/volatile/resource confidence model. |
| Include deserts, polar regions, volcanic/arid terrains | `02`, `08`, `11`, `23`–`25` | Covered as target environments, but polar DEM coverage limitations are noted and need a verified polar dataset selection. |
| Include caves | `02` | **Gap.** Caves are present in the problem statement only. No cave/subsurface analog discovery, cave geometry, thermal-stability or data-availability plan exists. |
| Present as map, visualization or tool | `13`, `15`, `33`, `34`, `55` | Covered. |

## 2. Screenshot feature alignment

The “Top 10 features to consider” screenshot visibly shows the first five feature proposals. They are user-provided product concepts, not additional text in the official NASA challenge statement.

| Screenshot feature | Current plan files | Status and notes |
|---|---|---|
| 1. Global Analog Discovery | `11-global-analog-discovery.md`, `22`–`26`, `29`–`31` | **Covered.** The full global vision is separated from the bounded hackathon AOI. Do not promise a full-resolution scan of the whole planet during the event. |
| 2. Mission-Specific Matching Engine | `12-mission-specific-matching.md`, `27-mission-profile-editor.md`, `30`, `43` | **Covered.** Profiles include rover mobility, EVA geology, drilling, habitat testing and solar/illumination. Actual solar-resource layers and astronaut-specific workload simulation remain gaps. |
| 3. Earth–Moon–Mars Gap Engine | `10-earth-moon-mars-gap-engine.md`, `32`, `41` | **Covered.** Gravity, atmosphere, radiation and other irreducible conditions are explicitly separated from ordinary similarity scores. |
| 4. 3D Terrain Digital Twin | `13-geospatial-3d-digital-twin.md`, `33`, `34`, `35` | **Mostly covered.** Terrain, elevation, slope and hazard overlays are planned. The cross-body 3D explorer with explicit Earth/Moon/Mars switching, coordinate/landmark search and planet-specific layer availability is not fully specified in one component contract. |
| 5. Mission Rehearsal Simulator | `14-mission-rehearsal-simulator.md`, `35`, `36`, `46` | **Partially covered.** Route planning, checkpoints, terrain penalties and warnings are included. The implementation is explicitly a simplified 2D route rehearsal in MVP; physics-accurate rover dynamics are out of scope. Astronaut EVA movement/workload is not specified beyond route sketching. |

## 3. Alignment with the uploaded Terracroma feature list

| User feature module | Current coverage | Audit |
|---|---|---|
| Planetary Explorer | `13`, `33`, `34`, `48` | Mostly covered, but planet switching, coordinate search, named planetary landmarks and a consistent three-body scene contract should be made explicit. |
| Earth Analog Discovery | `11`, `26`, `29`, `30`, `31` | Covered. |
| Research Lab / RAG | `37`, `38`, `51` | Covered at plan level: PDF ingestion, extraction, OCR, tables/captions, page citations and grounded retrieval. Embeddings/vector-store selection and figure-image extraction need implementation-level decisions. |
| Scientific Comparison Studio | `09`, `29`–`32`, `47` | Partially covered. Per-dimension comparisons are described, but side-by-side synchronized imagery/panels, metadata inspection, difference views and comparison-specific acceptance tests need a dedicated component contract. |
| Analog Intelligence | `31`, `41` | Covered. |
| Interactive Geospatial Intelligence | `13`, `25`, `33`–`36`, `48` | Mostly covered. Area/distance measurement, exporting AOIs and map interaction details are not fully enumerated. |
| Reports and Exports | `19`, `44`, `51` | **Partial.** Provenance manifests and a field-campaign brief are present, but the complete PDF/CSV/GeoJSON/image export and report-template workflow lacks a dedicated component plan. |
| User Workspace / Application Management | `16`, `18`, `47`, `49`, `50` | Mostly covered. Private saved research and optional auth exist. Profile/preferences, notification behavior and full research-history flows are not detailed; they should remain non-MVP unless needed. |
| Technical intelligence systems | `08`, `22`–`25`, `29`–`32`, `37`–`39`, `49`–`52` | Broadly covered. The deterministic science engine is correctly separated from LLM narration/orchestration. |

## 4. Novelty included in this plan

The following labels describe novelty **relative to the uploaded Terracroma baseline**, not a claim that no other team or product has ever built something similar.

| Proposal in plan | Plan file | Classification vs uploaded baseline | What it adds |
|---|---|---|---|
| Analog Transferability Intelligence | `41` | **Genuinely new workflow** | Labels each experiment condition as transferable, partial, non-transferable or unknown; maps gaps to facility tests or analytical interventions. |
| Multi-Site Analog Network | `42` | **Genuinely new workflow** | Finds a complementary set of sites when one location cannot cover all experiment conditions. |
| Experiment Coverage Optimizer | `43` | **Genuinely new workflow** | Models experiments against condition coverage, uncovered gaps and site combinations. |
| Field Campaign Intelligence | `44` | **Genuinely new workflow** | Turns uncertainty and missing evidence into a prioritized field measurement/transect plan. |
| Planetary Time Machine | `40` | **Extension with novel stability angle** | Adds seasonal/historical views and analog stability/campaign-window reasoning, with strict temporal comparability caveats. |
| Analog Degradation Monitor | `45` | **Genuinely new longitudinal capability** | Tracks whether candidate conditions drift across observation periods and whether evidence is sufficient. |
| Counterfactual Mission Lab | `46` | **Genuinely new interaction** | Lets users vary mission weights/constraints and compare how rankings, routes and coverage change without overwriting the baseline. |
| Autonomous Analog Discovery Agent | `39` | **Extension of baseline discovery + RAG** | Orchestrates data search, literature retrieval and dossier creation while deterministic code remains the score authority and a human approves claims. |
| Mission failure / hazard analysis | `35`, `36` | **Extension of baseline simulator** | Adds evidence-linked slope, roughness and obstacle warnings, but not certified safety or high-fidelity physics. |
| Human Factors & Habitat Stress Lab | Mentioned in `03` only | **Future proposal, not a complete component** | Candidate human-operations proxies are noted, but no separate plan, datasets or acceptance tests are included. |
| XR/immersive terrain review | `56` | **Optional future exploration** | A deferred extension point, not a core novelty and should not displace the MVP. |

### Strongest differentiated product story

The strongest coherent workflow is **Discover → Explain → Assemble → Simulate → Optimize**:

1. Discover candidates using measured, source-linked Earth and planetary features.
2. Explain why they match and where Earth cannot reproduce the target condition.
3. Assemble complementary sites to cover different mission experiments.
4. Simulate bounded route and equipment scenarios with transparent assumptions.
5. Optimize the next field measurements that would reduce the most important evidence gaps.

This is substantially more useful than a planet-globe viewer with a single similarity percentage.

### Novelty caution

A quick scan of other 2026 Space Apps project repositories shows that some elements in this portfolio are also being explored by other teams. For example, the public ODYSSEY repository describes experiment-first field-test planning, per-condition transferability gaps, a multi-site campaign and a tool-using agent; TerraNova and other projects describe evidence-backed ranking/provenance. These are not exhaustive prior-art searches, but they mean Terracroma should not claim “first” or globally unique for these ideas. The defensible distinction should be the quality of the integrated workflow, evidence provenance, temporal stability and field-measurement prioritization.

References:
- https://github.com/MahmoudAdelbghany/ODYSSEY
- https://github.com/Yakiyo/terra-nova
- https://github.com/Gharbawy1/Nasa-2026

## 5. Gaps to close before coding

### High priority: add dedicated component plans

1. **Resource and ISRU proxy explorer.** Separate mineral identification, water/volatile proxy layers, solar/illumination opportunity and resource confidence. Never infer a reserve or prove extractability from remote sensing alone. State which sources support each proxy and whether the evidence is direct, indirect or unavailable.
2. **Cave and subsurface analog assessment.** Inventory accessible cave/lava-tube/karst/ice-cave evidence, morphology data, entrance/geometry measurements, thermal-stability observations and data gaps. Treat most global cave data as sparse and do not claim a global cave scan unless a dataset supports it.
3. **Astronaut EVA and habitat operations planner.** Create a clearly bounded plan for EVA route/waypoint planning, illumination and work-window proxies, task workload proxies and habitat-to-site logistics. No health/medical or safety certification.
4. **Scientific comparison studio.** Specify synchronized side-by-side map/image views, shared coordinates/scale where valid, per-layer metadata, difference panels and export-ready figures.
5. **Reports and export generator.** Specify reproducible PDF, CSV, GeoJSON and figure packages with source manifest, methodology, uncertainty and limitations.

### Medium priority: clarify component contracts

- Make the Planetary Explorer's Earth/Moon/Mars scene switching, coordinate search, landmark search, selected AOI and unavailable-layer state explicit.
- Make the simulator's MVP rover-only or route-only boundary explicit; add astronaut EVA only after an appropriate movement/workload model exists.
- Add a solar-power/illumination data source and a validated time-window model before claiming the solar mission profile is functional.
- Add explicit drilling/geotechnical proxies only where relevant data exist; otherwise mark drilling as a future mission profile with field-measurement requirements.
- Expand `21-component-catalog-and-acceptance-tests.md` into a row for every visible feature in the uploaded list, not just the high-level challenge requirements.
- Expand `04-architecture.md` with concrete component/data contracts, API request/response shapes, storage layers, batch-vs-request processing, caching and failure paths.
- Expand the master dependency graph to include all plan files `00` through `56`, especially `37`–`56`; the current diagram is illustrative and omits several later modules.

## 6. Packaging and progress-system checks

- ZIP contains 57 plan Markdown files, including 35 component-focused files numbered `22`–`56`.
- All 57 plan files contain the required headings: Purpose, Scope, Tasks, Dependencies, Acceptance criteria, Anti-slop alignment, Estimated effort and Status.
- There are 230 uniquely identified implementation-task checkbox rows. The 231st `[TASK:...]` occurrence in the text is the documented example placeholder `[TASK:AREA-NNN]`, not a real task. The dashboard's 230 total is therefore correct.
- There are additional unchecked acceptance-criteria checklist rows; the progress script intentionally counts only task checkboxes under each `## Tasks` section.
- The updater's six unit tests pass in the inspected package, and `python scripts/update_progress.py --check` reports the generated progress artifacts as current.
- Dependency references in the plan pass the updater's missing-file/cycle validation.
- The ZIP includes Python `__pycache__` bytecode files. They are not needed and should be excluded from a clean source archive.
- The master dependency graph is incomplete relative to the 57-file plan set, as noted above.

## 7. Official resource-tab / video status

The official challenge details page can be read through indexed page content. The `?tab=resources` page did not return its resource list through the browser fetch in this audit, and no video URL or transcript could be independently verified. The source audit correctly records this limitation. The package should not state that the resource tab or its video were fully inspected. Before coding, manually open the official Resources tab, capture every required NASA/partner dataset and the video title/URL, then update `08-data-sources-and-ingestion.md` and `research/source-audit.md`.

Official URLs:
- Challenge details: https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/
- Resources tab: https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/?tab=resources

## Final decision

**Keep the current plan as the foundation, but do not call it fully feature-complete yet.** The central challenge and the five screenshot features are covered. Before using an AI coding agent for end-to-end implementation, close the five high-priority gaps above, update the master dependency graph and expand the component traceability matrix. Keep the MVP narrow: one target region, one or two Earth AOIs, a small set of measured layers, explainable scoring, a gap/transferability view, multi-site experiment coverage and a bounded rehearsal. Put global scanning, broad cave discovery, detailed EVA/habitat modeling, full resource prospecting and XR into later phases unless you already have verified data and time.

## 8. Prototype-ready package update (2026-11-14)

The hackathon-focused package update adds 11 plan files (`57`–`67`) and a `prototype/` folder. New dedicated plans close the five previously identified specification gaps: resource/ISRU proxy exploration, cave/subsurface assessment, astronaut EVA/habitat operations, scientific comparison studio, and scientific report/export generation. Additional plans define the hackathon MVP boundary, screen-by-screen UI, API/data contracts, judge demo script, prototype acceptance tests and deployment operations.

The Antigravity operating instructions now prioritize one end-to-end vertical slice: target AOI -> curated Earth candidates -> deterministic explainable matching -> evidence comparison -> transferability gaps -> bounded rover route -> cited report. The MVP is limited to one verified planetary AOI, two or three Earth candidate AOIs and one rover mobility/geological sampling profile. Resource prospecting, cave/subsurface, EVA/habitat, global scanning, autonomous agent orchestration, climate drift and XR are stretch/future unless data and time are already available.

The hackathon stack is made more decisive: React + TypeScript + Vite; MapLibre GL JS for 2D; Three.js for one preprocessed DEM-based 3D terrain scene; FastAPI + Pydantic; Python geospatial processing; SQLite/local files for the event. This is a project recommendation, not an assertion that these components have been implemented.

The package now contains 68 plan Markdown files and 311 unique task checkboxes. Initial progress remains 0% because the application source code has not yet been built. The progress updater and six existing unit tests pass, and generated progress mirrors are current.

## 9. Remaining pre-build verification

- The official Space Apps challenge resource tab and embedded YouTube video were not independently verified in the prior research environment. The coding team must manually inspect the tab and update `08-data-sources-and-ingestion.md` and `research/source-audit.md` before finalizing the data selection.
- The source manifest is a template. No dataset has been downloaded or scientifically processed by this planning ZIP.
- Gale Crater, Atacama, Ladakh/Spiti and volcanic analogs are suggested demonstration candidates only. Select final AOIs after checking source coverage, resolution, CRS, licenses and suitability.
- This package is a build specification and execution system, not the working application. The prototype exists only after Antigravity creates frontend/backend code and passes `plan/66-prototype-acceptance-tests.md`.
