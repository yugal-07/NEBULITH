# AGENTS.md — Terracroma.ai (Antigravity build instructions)

## Mission
Build a working NASA Space Apps hackathon prototype from this repository. This ZIP is a complete planning/specification package, not an already implemented application. Do not claim the frontend, backend, datasets, 3D scene or simulator exist until they are implemented and tested.

## Mandatory startup
1. Read this file, `README.md`, `DESIGN.md` and `plan/00-MASTER-EXECUTION-GUIDE.md`.
2. Read `plan/62-hackathon-mvp-build-specification.md` through `plan/67-deployment-and-demo-operations.md`.
3. Read `research/alignment-audit.md` and `research/source-audit.md`.
4. Read the dependencies of the next task and check `progress/PROGRESS-DASHBOARD.md`.
5. Inspect the current repository before creating or replacing code.

## Build target
- Primary coding agent: Google Antigravity.
- Target: hackathon-ready working prototype, not the entire future product.
- Required vertical slice: target selection -> candidate discovery -> explainable score -> comparison -> transferability gaps -> bounded rover route -> cited report.
- Scope: one verified planetary AOI, two or three Earth candidate AOIs, one rover mobility/geological sampling profile.
- Use MapLibre GL JS for 2D mapping and Three.js for one preprocessed DEM-based 3D terrain scene unless a tested alternative is recorded in a decision log.
- Use React + TypeScript + Vite, FastAPI + Pydantic, Python geospatial processing, SQLite/local files for the hackathon.

## Source of truth
- `plan/` is product scope, tasks, dependencies and acceptance criteria.
- `DESIGN.md` is visual direction.
- `prototype/` contains MVP build artifacts and implementation checklists.
- `progress/` is generated from task checkboxes, except append-only `completed-log.md`.
- Application code, tests and data manifests prove implementation. A checked task without evidence is not acceptable.

## Scientific integrity
- Preserve source product units, CRS, resolution, dates, uncertainty, nodata and license/attribution.
- Label values as observed, derived, modeled, inferred, qualitative or synthetic demo fixture.
- Null means unknown. Do not convert missing values to zero or a match.
- The deterministic science service owns numeric scores. An LLM may summarize evidence but may not invent measurements or alter scores.
- Earth field sites cannot reproduce lunar/Martian gravity, vacuum/atmosphere or radiation. Show these limits explicitly.
- Mobility and EVA outputs are planning indicators, not certified safety findings.
- Distinguish analog similarity, field-test suitability and operational safety.

## UI work
Read `DESIGN.md`, `plan/06-anti-slop-skills-mapping.md` and `plan/07-ui-ux-pro-max-skills-mapping.md`. Resolve the Anti-Slop DURING/AFTER mode with the user if not already selected. Every visible control must work or be explicitly unavailable. Run keyboard, contrast, reduced-motion, mobile-reflow and functional Delivery Gates.

## Hackathon prioritization
1. Build a single end-to-end vertical slice.
2. Use verified and pre-cached data for a narrow AOI, not global downloads.
3. Make missing-data and offline states honest and usable.
4. Build the 2D map and one focused 3D terrain scene.
5. Add stretch features only after all critical acceptance tests pass.
6. Do not build XR, production authentication, global real-time scanning or high-fidelity rover physics for the MVP.

## Task workflow
1. Select an unblocked task from the dashboard.
2. Read its dependencies and acceptance criteria.
3. Implement only the task scope.
4. Run relevant tests and save evidence.
5. Check the task only after acceptance criteria pass.
6. Run `python scripts/update_progress.py` and review generated status.
7. Commit code, tests and plan updates together.

## Local progress commands
```bash
python scripts/install_hooks.py
python scripts/update_progress.py
python -m unittest discover -s tests -v
python scripts/update_progress.py --check
```

## Safe operation
Never commit secrets, never embed Earthdata credentials in the browser, never fabricate telemetry or NASA values, never overwrite research source files, and never erase completion history. Record scope changes in `plan/20-risk-register-and-decisions.md`.
