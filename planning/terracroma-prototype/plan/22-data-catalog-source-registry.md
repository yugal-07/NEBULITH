# Data catalog and source registry

**Purpose:** Maintain a machine-readable registry of provider datasets, versions, coverage, access and citation rules.

## Scope
### In scope
- Implement the data catalog and source registry capability: Maintain a machine-readable registry of provider datasets, versions, coverage, access and citation rules.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Register SRTMGL1, HLS, EMIT, CRISM, MOLA/LOLA, CTX/WMTS and Diviner records.; Capture DOI/concept ID, temporal/spatial coverage, resolution, CRS, units and license metadata.; Add source health and access/authentication notes.

### Out of scope
- Upstream capabilities owned by: 08-data-sources-and-ingestion.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P22-001] Register SRTMGL1, HLS, EMIT, CRISM, MOLA/LOLA, CTX/WMTS and Diviner records.
- [ ] [TASK:P22-002] Capture DOI/concept ID, temporal/spatial coverage, resolution, CRS, units and license metadata.
- [ ] [TASK:P22-003] Add source health and access/authentication notes.

## Dependencies
- `08-data-sources-and-ingestion.md`

## Acceptance criteria
- [ ] Every MVP layer has a source registry record and citation.
- [ ] Unknown license/access fields remain explicitly pending.

## Anti-slop alignment
human: provenance and non-color labels; copywriting: named sources, no vague authority.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
