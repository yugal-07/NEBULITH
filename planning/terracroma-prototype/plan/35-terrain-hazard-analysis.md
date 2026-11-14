# Terrain hazard analysis

**Purpose:** Derive terrain indicators relevant to mobility/field access without claiming certified safety.

## Scope
### In scope
- Implement the terrain hazard analysis capability: Derive terrain indicators relevant to mobility/field access without claiming certified safety.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Calculate slope bands, roughness and obstacle proxies from available data.; Allow mission profile thresholds with source labels.; Display unknown zones where data resolution is insufficient.

### Out of scope
- Upstream capabilities owned by: 29-multi-dimensional-feature-extraction.md, 27-mission-profile-editor.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P35-001] Calculate slope bands, roughness and obstacle proxies from available data.
- [ ] [TASK:P35-002] Allow mission profile thresholds with source labels.
- [ ] [TASK:P35-003] Display unknown zones where data resolution is insufficient.

## Dependencies
- `29-multi-dimensional-feature-extraction.md`
- `27-mission-profile-editor.md`

## Acceptance criteria
- [ ] Warnings trace to a measured/derived value and configured threshold.
- [ ] No risk label appears where input coverage is insufficient.

## Anti-slop alignment
core R-17; human skill accessible status.

## Estimated effort
L

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
