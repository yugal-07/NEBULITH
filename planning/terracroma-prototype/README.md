# Terracroma.ai — Hackathon Prototype Build Package

This repository is the agent-ready specification and execution system for a working Terracroma.ai prototype. It is **not the application source code yet**. Antigravity should use these files to build the app and prove each completed task with code and tests.

## Start here
1. Open this repository as a project in Google Antigravity.
2. Paste the instructions in `ANTIGRAVITY-START-PROMPT.md` into the agent chat.
3. Ask the agent to read `AGENTS.md`, `DESIGN.md` and `plan/00-MASTER-EXECUTION-GUIDE.md`.
4. Read `plan/62-hackathon-mvp-build-specification.md` through `plan/67-deployment-and-demo-operations.md` before coding.
5. Review `research/alignment-audit.md` and `research/source-audit.md`.
6. Start with the first unblocked task in `progress/PROGRESS-DASHBOARD.md`.

## Recommended hackathon vertical slice
Target AOI -> curated Earth candidates -> deterministic explainable match -> evidence comparison -> Earth/Moon/Mars transferability gaps -> bounded rover route rehearsal -> cited report export.

Keep the first demo to one verified planetary target, two or three Earth candidate AOIs and one rover mobility/geological sampling profile. Cache data before the event. Synthetic fixtures are allowed only for layout/error-state development and must be visibly labelled.

## Included
- 68 detailed plan files, including 40+ component/workflow specifications.
- Dedicated plans for resource proxies, caves/subsurface, EVA/habitat operations, comparison studio and report exports.
- Hackathon MVP build specification, screen-by-screen UI, API/data contracts, demo script, acceptance tests and deployment runbook.
- Progress dashboard, append-only completion log, per-file mirrors, Python updater, unit tests and GitHub Actions workflow.
- Research/source audit and novelty/alignment audit.

## Progress tooling
```bash
python scripts/install_hooks.py  # once in a Git clone
python scripts/update_progress.py
python -m unittest discover -s tests -v
python scripts/update_progress.py --check
```
Progress percentages are calculated from task checkboxes under each plan's `## Tasks` section. A checked task must have implementation/test evidence. Empty plans and plans with incomplete dependencies are never Done.

## Current status
The package is a plan/specification repository. The initial progress is 0% because no application implementation tasks have been completed. Do not represent it as a finished working prototype until Antigravity has implemented and passed `plan/66-prototype-acceptance-tests.md`.

## Research limitation
The official challenge details page was available through indexed content. The official resources tab and its embedded video could not be independently verified in the prior research environment. See `research/source-audit.md`; manually verify those links before selecting final data products.
