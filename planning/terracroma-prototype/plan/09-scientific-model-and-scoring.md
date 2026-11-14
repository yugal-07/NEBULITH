# Scientific model and scoring

**Purpose:** Specify a transparent multi-criteria analog model that handles measurement mismatch, missing data, uncertainty and transferability without false precision.

## Scope
### In scope
- Feature normalization and comparability
- Per-dimension similarity, mission weights and confidence
- Missing-data policy, sensitivity analysis and reproducibility

### Out of scope
- LLM-generated scores
- Unexplained single similarity percentage
- Equating an Earth analog with a Moon/Mars environment

## Tasks
- [ ] [TASK:P09-001] Define measured/derived/modeled/inferred/qualitative value classes.
- [ ] [TASK:P09-002] Define feature-specific similarity functions and normalization provenance.
- [ ] [TASK:P09-003] Implement missing-data as unknown with coverage penalty, not as match or mismatch.
- [ ] [TASK:P09-004] Propagate uncertainty or interval ranges where source products provide them.
- [ ] [TASK:P09-005] Run sensitivity analysis across weights and plausible inputs.
- [ ] [TASK:P09-006] Validate known analogs and holdout regions without treating benchmark familiarity as independent ground truth.

## Dependencies
- `08-data-sources-and-ingestion.md`
- `16-backend-api-and-data-model.md`

## Acceptance criteria
- [ ] Every score lists component values, units, source, method and uncertainty.
- [ ] Changing weights yields a reproducible ranking and sensitivity view.
- [ ] No-data is not silently imputed as zero or perfect.
- [ ] Earth-only irreducible dimensions cannot be awarded a normal similarity score.

## Anti-slop alignment
antislop core R-17/R-36 and copywriting: claims must be sourced; UI data skill: charts include scale, legends and uncertainty.

## Estimated effort
L

## Status
**Status:** Not started

### Recommended scoring design
Represent each candidate as a vector of comparable dimensions. For a target value `t_k` and Earth candidate `x_k`, define a dimension-specific similarity function only when the physical quantities are meaningfully comparable. Examples: normalized absolute difference for bounded continuous measures; distribution distance for terrain-window samples; categorical compatibility matrix for landform class; spectral angle only when spectral ranges, calibration and processing are compatible. Keep raw values next to normalized scores.

For available comparable dimensions, combine dimension similarity with mission weights. Prefer weighted arithmetic mean for interpretable compensability, or a weighted geometric mean when a near-zero score should act as a strong veto. State the choice and why. Report a separate observed-data coverage fraction. Never multiply coverage into similarity without showing it separately.

### Missingness and confidence
`missing = unknown`, not zero, not mismatch. Confidence is not a second similarity score. Calculate confidence from data quality, coverage, age, resolution match, geolocation quality and uncertainty metadata; disclose each ingredient and avoid opaque confidence percentages when there is no validated calibration. For MVP show labels (High/Moderate/Low/Insufficient evidence) with explicit rules.

### Important feature mismatches
- Elevation: absolute elevation references differ because Earth/Moon/Mars datums and planetary radii differ. Prefer local relief, relative elevation and normalized neighborhood statistics, not raw elevation equality.
- Slope: compute with consistent horizontal/vertical units and pixel scale.
- Roughness: same window size in metres and same algorithm; otherwise compare cautiously.
- Minerals: compare identified species and confidence/uncertainty; don't infer resource abundance from presence alone.
- Thermal: match day/night or seasonal context, latitude, local time, units and sensor retrieval.
- Gravity, vacuum and radiation: not naturally reproducible at an Earth field site; show as irreducible/facility-dependent gaps.

### Reproducibility
Persist scoring-config version, weights, thresholds, data product version, processing software version, AOI geometry, timestamp and random seed if applicable. Provide a “why this rank changed” diff after any configuration edit.

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
