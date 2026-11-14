# Risk register and decisions

**Purpose:** Record the major scientific, data, delivery and product risks plus explicit decisions and reversal triggers.

## Scope
### In scope
- Risk register, novelty selection record, source gaps, tradeoffs and do-not-build list

### Out of scope
- Unreviewed risk prose without owners or triggers

## Tasks
- [ ] [TASK:P20-001] Create risk entries for missing resources, incompatible datasets, over-scoping, model uncertainty and external service outages.
- [ ] [TASK:P20-002] Record accepted novelty set and deferred ideas.
- [ ] [TASK:P20-003] Review risk severity at each milestone.
- [ ] [TASK:P20-004] Update decision records when new official resources or expert input arrive.

## Dependencies
- `02-problem-statements.md`
- `03-core-ideas.md`
- `08-data-sources-and-ingestion.md`

## Acceptance criteria
- [ ] Every high risk has mitigation and trigger.
- [ ] Feature scope decisions are traceable.
- [ ] No unverified resource-tab assumption is embedded in implementation tasks.

## Anti-slop alignment
antislop core purpose test; human accessibility risk checks; copywriting evidence over claims.

## Estimated effort
M

## Status
**Status:** Not started

### Decision record DR-001: Novelty portfolio (provisional)
Date: 2026-11-14. Accepted for MVP: Transferability Intelligence, Multi-Site Analog Network/Experiment Coverage, evidence-grounded route rehearsal, and limited temporal stability if compatible HLS scenes are available. Agentic discovery is constrained to orchestration and evidence collection; the deterministic science engine remains the score authority. Deferred: full climate drift alerts, human factors, full counterfactual rover dynamics and XR. Revisit after first data pipeline succeeds.

### Feature selection rubric
Score each proposal 1–5 for challenge fit, scientific defensibility, data availability, 24–48h feasibility, demo clarity and differentiating value; subtract risk/complexity. Any feature that requires unsupported measured inputs or a false safety claim is rejected regardless of total.

### Major risks
- Official `?tab=resources` and linked video not retrievable in the research environment; manual browser verification remains required.
- HLS/EMIT access may require Earthdata credentials; use pre-fetched, licensed sample windows in demo.
- Earth SRTM coverage excludes high latitudes; do not use SRTM for polar analogs.
- CRISM spectral products and Earth EMIT mineral products do not have identical instruments/ranges; cross-sensor mineral class comparison needs careful harmonization and literature support.
- A single “similarity score” may hide irreducible physics; show per-condition transferability and evidence coverage separately.
- Route risk is a terrain proxy and must not be described as certified rover safety.

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
