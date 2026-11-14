# Paste this prompt into Google Antigravity

You are the lead architect and implementation agent for Terracroma.ai. This repository is the project specification and progress-control source of truth. It is not yet a working app. Your goal is to build a functional hackathon prototype, not another plan or static UI mockup.

## Read before coding
Read `AGENTS.md`, `README.md`, `DESIGN.md`, `plan/00-MASTER-EXECUTION-GUIDE.md`, `plan/62-hackathon-mvp-build-specification.md`, `plan/63-screen-by-screen-ui-specification.md`, `plan/64-api-contracts-and-data-models.md`, `plan/65-demo-scenarios-and-judge-script.md`, `plan/66-prototype-acceptance-tests.md`, `plan/67-deployment-and-demo-operations.md`, `prototype/FEATURE-PRIORITY-MATRIX.md`, `prototype/IMPLEMENTATION-BACKLOG.md`, `research/source-audit.md` and `research/alignment-audit.md`.

## First response
Before implementation, report:
1. Current repository structure and whether any application code already exists.
2. The first vertical slice you will build.
3. The data products and AOIs that still require verification.
4. Any blockers or stack risks.
5. A concise task sequence mapped to existing TASK IDs.

If Anti-Slop DURING/AFTER mode has not been selected, ask the user to choose before UI implementation.

## Required MVP
Build this working flow:
`select target AOI -> choose rover/geology mission -> discover 2-3 curated Earth analog candidates -> explain deterministic scores -> compare evidence -> show Earth/Moon/Mars transferability gaps -> rehearse a bounded rover route -> export a cited report`.

## Stack recommendation
- React + TypeScript + Vite.
- MapLibre GL JS for the 2D map.
- Three.js for one preprocessed DEM-based 3D terrain scene.
- FastAPI + Pydantic backend.
- Python geospatial preprocessing and deterministic scoring.
- SQLite and local cached files for hackathon persistence.

If you change the stack, record the reason and update the relevant plan files before implementation.

## Non-negotiable rules
- Use real, verified data for scientific claims. The source manifest is a template until populated and verified.
- Synthetic fixtures must be explicitly labelled and cannot masquerade as measurements.
- Missing data are unknown, not zero.
- LLMs may explain cited evidence but cannot invent values or modify deterministic scores.
- Earth cannot reproduce lunar/Martian gravity, vacuum/atmosphere or radiation. Keep these gaps visible.
- Route and EVA outputs are planning aids, not safety certifications.
- No global scan, XR, detailed physics or production authentication before the MVP works.
- Every visible control must function.

## Execution
Work task-by-task using the dashboard and dependencies. Implement code, tests and documentation. Only check a TASK checkbox after its acceptance criteria pass. Run:
`python scripts/update_progress.py`
`python -m unittest discover -s tests -v`
`python scripts/update_progress.py --check`

Do not stop after the first frontend screen. Complete and demonstrate the full vertical slice, run `plan/66-prototype-acceptance-tests.md`, and prepare the offline demo described in `plan/65-demo-scenarios-and-judge-script.md`.
