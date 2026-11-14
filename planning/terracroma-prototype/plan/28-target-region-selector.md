# Target region selector

**Purpose:** Select Moon/Mars locations by named region, coordinate or drawn AOI and carry the correct planetary reference system.

## Scope
### In scope
- Implement the target region selector capability: Select Moon/Mars locations by named region, coordinate or drawn AOI and carry the correct planetary reference system.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Search supported lunar/Martian landmarks.; Allow coordinate/AOI selection with lat/long convention validation.; Display target product coverage and metadata.

### Out of scope
- Upstream capabilities owned by: 24-planetary-data-ingestion.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P28-001] Search supported lunar/Martian landmarks.
- [ ] [TASK:P28-002] Allow coordinate/AOI selection with lat/long convention validation.
- [ ] [TASK:P28-003] Display target product coverage and metadata.

## Dependencies
- `24-planetary-data-ingestion.md`

## Acceptance criteria
- [ ] Selected target is stored with body, coordinate reference and dataset versions.
- [ ] Unsupported coordinates return a clear error.

## Anti-slop alignment
human skill: labelled controls; UI UX navigation and form rules.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
