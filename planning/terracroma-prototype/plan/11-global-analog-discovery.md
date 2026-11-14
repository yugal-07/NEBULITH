# Global analog discovery

**Purpose:** Define a discovery workflow that screens Earth for promising analog candidates rather than returning only famous analog-site catalogs.

## Scope
### In scope
- AOI tiling, environment screening, feature extraction, candidate ranking and novelty flags
- Global architecture and a bounded MVP scan

### Out of scope
- Unbounded full-resolution global processing in the hackathon
- Treating candidate novelty as proof of scientific discovery

## Tasks
- [ ] [TASK:P11-001] Define candidate grid/landform sampling strategy.
- [ ] [TASK:P11-002] Create environment masks and exclusions for water/vegetation/urban/low-coverage as mission profile requires.
- [ ] [TASK:P11-003] Run the deterministic feature extraction/scoring pipeline over a bounded AOI.
- [ ] [TASK:P11-004] Flag known analogs separately from newly surfaced candidates.
- [ ] [TASK:P11-005] Return candidate geometries and evidence links.

## Dependencies
- `09-scientific-model-and-scoring.md`
- `22-data-catalog-source-registry.md`
- `25-geospatial-normalization-and-tiling.md`
- `26-analog-candidate-index.md`

## Acceptance criteria
- [ ] A scan can be reproduced from AOI, input versions and config.
- [ ] Known sites are benchmarks, not guaranteed top-ranked results.
- [ ] Candidate map can distinguish new-to-catalog vs validated-known sites.

## Anti-slop alignment
antislop core C-3: prioritize the decision; UI data charts and maps show source/quality rather than decorative stats.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
