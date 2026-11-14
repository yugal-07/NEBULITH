# API, auth and session controls

**Purpose:** Protect API operations and manage optional user accounts without making auth a blocker for the hackathon MVP.

## Scope
### In scope
- Implement the api, auth and session controls capability: Protect API operations and manage optional user accounts without making auth a blocker for the hackathon MVP.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Define public demo/read-only mode.; Add optional email/OAuth auth only if implementation time allows.; Validate AOI and uploads server-side.

### Out of scope
- Upstream capabilities owned by: 16-backend-api-and-data-model.md, 18-deployment-security-and-operations.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P49-001] Define public demo/read-only mode.
- [ ] [TASK:P49-002] Add optional email/OAuth auth only if implementation time allows.
- [ ] [TASK:P49-003] Validate AOI and uploads server-side.
- [ ] [TASK:P49-004] Rate limit expensive scans.

## Dependencies
- `16-backend-api-and-data-model.md`
- `18-deployment-security-and-operations.md`

## Acceptance criteria
- [ ] Public demo cannot trigger unbounded ingestion.
- [ ] Credentials and uploads are access-controlled.

## Anti-slop alignment
core: no fake login UI; human: form labels/errors; layoutmobile.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
