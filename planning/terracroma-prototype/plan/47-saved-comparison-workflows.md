# Saved comparisons and research workspaces

**Purpose:** Persist candidate sets, target pairs, filters, scenario versions and report history.

## Scope
### In scope
- Implement the saved comparisons and research workspaces capability: Persist candidate sets, target pairs, filters, scenario versions and report history.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Save comparison snapshots with source versions.; Restore filters/AOIs and export metadata.; Keep workspace private by default.

### Out of scope
- Upstream capabilities owned by: 16-backend-api-and-data-model.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P47-001] Save comparison snapshots with source versions.
- [ ] [TASK:P47-002] Restore filters/AOIs and export metadata.
- [ ] [TASK:P47-003] Keep workspace private by default.

## Dependencies
- `16-backend-api-and-data-model.md`

## Acceptance criteria
- [ ] Restored session reproduces comparison config.
- [ ] No uploaded private paper is shared publicly by default.

## Anti-slop alignment
human: accessible states; core R-38 privacy honesty.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
