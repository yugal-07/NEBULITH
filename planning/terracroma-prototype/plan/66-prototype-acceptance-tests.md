# Prototype Acceptance Tests

**Purpose:** Define observable pass/fail conditions for the hackathon prototype.

## Scope
### In scope
- End-to-end workflow, scientific integrity, provenance, UI function, accessibility, responsive behavior, performance and offline fallback.
### Out of scope
- Production certification, exhaustive planetary validation or safety certification.

## Tasks
- [ ] [TASK:QA-001] Fresh setup starts frontend and backend using documented commands.
- [ ] [TASK:QA-002] User creates/opens study and selects target AOI.
- [ ] [TASK:QA-003] User selects mission profile and runs candidate discovery.
- [ ] [TASK:QA-004] Candidate ranking is deterministic for identical inputs/configuration.
- [ ] [TASK:QA-005] Candidate detail shows per-dimension evidence, units, source and missing-data state.
- [ ] [TASK:QA-006] Comparison Studio prevents invalid cross-sensor pixel differencing.
- [ ] [TASK:QA-007] Transferability explicitly identifies non-reproducible conditions.
- [ ] [TASK:QA-008] User calculates bounded route and inspects warnings/assumptions.
- [ ] [TASK:QA-009] User downloads report and CSV/GeoJSON exports.
- [ ] [TASK:QA-010] Offline mode loads cached data with visible cache/demo label.
- [ ] [TASK:QA-011] Missing data remain null/unknown and follow documented scoring rules.
- [ ] [TASK:QA-012] Every score has algorithm/config version and dimension breakdown.
- [ ] [TASK:QA-013] Gravity, vacuum/atmosphere and radiation limits cannot be treated as ordinary matches.
- [ ] [TASK:QA-014] Synthetic fixtures are visibly labelled and excluded from observed-data exports.
- [ ] [TASK:QA-015] Exports include source lineage, units, uncertainty and limitations.
- [ ] [TASK:QA-016] All primary navigation and visible controls work.
- [ ] [TASK:QA-017] Keyboard-only user can complete core journey without map gestures.
- [ ] [TASK:QA-018] Contrast, focus, reduced motion, form labels and touch targets are reviewed.
- [ ] [TASK:QA-019] No horizontal overflow on phone/tablet/desktop widths.
- [ ] [TASK:QA-020] Loading, error, empty, partial and unavailable-source states are usable.
- [ ] [TASK:QA-021] Cached demo path works with network disabled.
- [ ] [TASK:QA-022] Performance is measured on target laptop; raster processing stays off main UI thread.

## Dependencies
- `17-validation-testing-and-scientific-integrity.md`
- `62-hackathon-mvp-build-specification.md`
- `63-screen-by-screen-ui-specification.md`
- `64-api-contracts-and-data-models.md`
- `65-demo-scenarios-and-judge-script.md`

## Acceptance criteria
- All critical end-to-end and scientific-integrity tests pass.
- No P0/P1 defect remains in judge workflow.
- Accessibility/responsive checklist is recorded.
- Test report includes environment, commit, commands and outcomes.

## Anti-slop alignment
- antislop R-17/R-26/R-35/R-36: sourced content, working controls and tested UI.
- antislop-layoutmobile: responsive states are tested at content breakpoints.
- UI UX Pro Max: accessibility and quality assurance practices.

## Estimated effort
L

## Status
**Status:** Not started
