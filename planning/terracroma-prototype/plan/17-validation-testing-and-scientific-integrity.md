# Validation, testing and scientific integrity

**Purpose:** Establish numerical, spatial, scientific, UX and product validation gates before any claim is used in a demo or report.

## Scope
### In scope
- Algorithm unit tests, geospatial consistency, baseline comparisons, expert review and uncertainty display
- Accessibility/performance and reproducibility checks

### Out of scope
- Claiming scientific validation from visual plausibility alone
- Using famous sites as both training evidence and independent test truth

## Tasks
- [ ] [TASK:P17-001] Create synthetic fixtures with known expected outputs for math and spatial functions.
- [ ] [TASK:P17-002] Check unit conversion, CRS transformations, nodata and resolution mismatches.
- [ ] [TASK:P17-003] Benchmark a small set of known analog and non-analog controls with literature context.
- [ ] [TASK:P17-004] Test ranking sensitivity and data dropout.
- [ ] [TASK:P17-005] Run accessibility, mobile and performance audits.
- [ ] [TASK:P17-006] Require expert review of any interpretive geological statements.

## Dependencies
- `09-scientific-model-and-scoring.md`
- `08-data-sources-and-ingestion.md`

## Acceptance criteria
- [ ] All core scoring code has tests and deterministic config.
- [ ] No-data and uncertainty paths are tested.
- [ ] Known analog checks are documented as sanity checks, not proof.
- [ ] Reports contain methodology and limitations.

## Anti-slop alignment
antislop core Delivery Gate; human skill WCAG contrast checker and state checklist; UI UX Pro Max performance and charts/data guidelines.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
