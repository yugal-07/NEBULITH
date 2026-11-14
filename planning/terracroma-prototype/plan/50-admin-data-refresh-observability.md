# Admin data refresh and observability

**Purpose:** Make ingestion jobs observable and safely refreshable with source health and cache state.

## Scope
### In scope
- Implement the admin data refresh and observability capability: Make ingestion jobs observable and safely refreshable with source health and cache state.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Track job status, source failures and checksums.; Provide retry/backoff and bounded request limits.; Record product/version changes and invalidate stale derived layers.

### Out of scope
- Upstream capabilities owned by: 22-data-catalog-source-registry.md, 18-deployment-security-and-operations.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P50-001] Track job status, source failures and checksums.
- [ ] [TASK:P50-002] Provide retry/backoff and bounded request limits.
- [ ] [TASK:P50-003] Record product/version changes and invalidate stale derived layers.

## Dependencies
- `22-data-catalog-source-registry.md`
- `18-deployment-security-and-operations.md`

## Acceptance criteria
- [ ] Failed sources surface a useful state and do not corrupt prior good data.
- [ ] Admin actions are permissioned.

## Anti-slop alignment
antislop-ui: status is real; code: comments explain retry/consistency constraints.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
