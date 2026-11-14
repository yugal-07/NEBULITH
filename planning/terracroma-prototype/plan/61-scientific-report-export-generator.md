# Scientific Report and Export Generator

**Purpose:** Produce reproducible, source-attributed outputs from a saved analog study.

## Scope
### In scope
- HTML/PDF report, CSV candidate table, GeoJSON AOIs and provenance manifest.
- Methodology, scoring configuration, uncertainty, missing-data coverage and limitations.
- Reports generated from frozen study snapshots and versioned inputs.
### Out of scope
- Peer-reviewed publication claims or conclusions beyond evidence.
- Exporting credentials or unlicensed source assets.

## Tasks
- [ ] [TASK:REP-001] Define versioned study snapshot schema.
- [ ] [TASK:REP-002] Define report sections: mission, target, candidates, score breakdown, gaps, sources, uncertainty and limitations.
- [ ] [TASK:REP-003] Implement CSV and GeoJSON exports with CRS and field metadata.
- [ ] [TASK:REP-004] Implement printable HTML report and optional PDF conversion.
- [ ] [TASK:REP-005] Test provenance completeness and reproducibility of exports.

## Dependencies
- `04-architecture.md`
- `09-scientific-model-and-scoring.md`
- `16-backend-api-and-data-model.md`
- `31-explainability-and-evidence-panel.md`
- `51-provenance-and-citations.md`

## Acceptance criteria
- Each report is tied to a frozen study/configuration identifier.
- Every value traces to a source or processing recipe.
- CSV/GeoJSON preserve units, IDs and CRS metadata.
- Reports distinguish analog suitability from safety and planetary equivalence.

## Anti-slop alignment
- antislop core R-17/R-36: no unsupported statistics or citations.
- antislop-copywriting: concise technical language.
- UI UX Pro Max: accessible report structure and meaningful export feedback.

## Estimated effort
M

## Status
**Status:** Not started
