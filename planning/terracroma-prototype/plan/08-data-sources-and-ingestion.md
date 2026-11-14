# Data sources and ingestion strategy

**Purpose:** Define a vetted source catalog for the MVP and the broader platform, including products, access methods, coverage, provenance and limitations.

## Scope
### In scope
- Official challenge resources and verified primary-source datasets
- Earth terrain, mineralogy, time series and planetary terrain/thermal data
- CMR, Earthdata, PDS/ODE and tile services

### Out of scope
- Assuming one challenge page contains all data values
- Downloading entire global archives for the MVP
- Using all products as if their pixel scales/units are directly comparable

## Tasks
- [ ] [TASK:P08-001] Register every candidate collection with stable identifier, DOI/concept ID and provider.
- [ ] [TASK:P08-002] For the MVP, select one Earth DEM, one Earth imagery/mineral product and one planetary target terrain product.
- [ ] [TASK:P08-003] Test data discovery and access using official APIs or a curated local extract.
- [ ] [TASK:P08-004] Record data licenses, citations, access requirements and attribution.
- [ ] [TASK:P08-005] Implement source freshness and checksum tracking.

## Dependencies
- `04-architecture.md`
- `05-tech-stack.md`

## Acceptance criteria
- [ ] Each selected source has a verified landing page and machine access path.
- [ ] Ingestion metadata carries source version, temporal range, resolution, CRS, units and quality flags.
- [ ] The challenge resource-tab limitation is explicitly tracked.

## Anti-slop alignment
antislop core R-17/R-36: no unsupported measured values; copywriting skill: no fabricated attribution; human skill: missing data visible.

## Estimated effort
L

## Status
**Status:** Not started

### Challenge resource audit
The official challenge page is the authority for the problem statement. Its page search result confirms the title, subjects, difficulty labels and challenge description. The `?tab=resources` page did not render through the available fetcher (cache miss). The embedded YouTube video and all official resources-tab links therefore remain unverified. Do not treat the following independent dataset list as official Space Apps resources.

### Independent starter catalog surfaced during research
A third-party Space Data Atlas page, marked independent/not affiliated with NASA or Space Apps, listed six useful starter datasets for this challenge: EMIT L2B mineral products, SRTMGL1 1 arc-second, HLSL30, CRISM MTRDR, Mars Trek WMTS layers and LRO Diviner global/polar temperature maps. This list is a useful engineering lead, not an official source endorsement: https://spacedata.swapniltamse.com/challenges/earth-analogs-moon-mars/ .

### MVP candidates
| Dataset/service | Role | Practical access | Important caveat |
|---|---|---|---|
| NASA SRTMGL1 V003 | Earth elevation and derived slope/roughness | LP DAAC/Earthdata; 1 arc-second ~30 m product | Coverage is near-global but not polar; observation epoch is 2000; not a modern surface survey. Product DOI 10.5067/MEASURES/SRTM/SRTMGL1.003. |
| NASA HLSL30/HLSS30 v2.0 | Harmonized Landsat/Sentinel-2 optical time series | CMR/Earthdata Search and `earthaccess`; COG assets | Cloud/shadow screening and sensor harmonization required; 30 m nominal grid. |
| NASA EMITL2BMIN V001 | Mineral identification, band depth and uncertainty | LP DAAC CMR, Earthdata Login for downloads | 60 m; raw/non-orthocorrected product; product's mineral maps and uncertainty must be preserved; some minerals require further validation. |
| Mars Trek WMTS, CTX and MOLA | Planetary imagery and broad terrain context | NASA Solar System Treks tile service | Confirm projection, tile matrix, service availability and licensing before production. Not same sensor/scale as Earth data. |
| CRISM MTRDR/MRDR | Mars mineralogy/spectral reference | PDS Geosciences Node and ODE | Hyperspectral products require instrument-specific processing and quality screening. |
| LOLA / LRO Diviner | Lunar elevation and temperature context | PDS Geosciences Node / ODE; Diviner archive | Polar illumination/temperature varies with location and season; gridded product scale matters. |

### Official discovery and ingestion references
- NASA Earthdata Search: https://search.earthdata.nasa.gov/
- NASA CMR API: https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html
- Earthaccess Python library: https://earthaccess.readthedocs.io/
- LP DAAC EMIT data discovery tutorial: https://nasa.github.io/LPDAAC-Data-Resources/external/Finding_EMIT_L2B_Data.html
- EMIT L2B MIN DOI / product metadata: https://doi.org/10.5067/EMIT/EMITL2BMIN.001
- EMIT mineralogy tutorial and limitations: https://nasa.github.io/LPDAAC-Data-Resources/external/Working_with_EMIT_L2B_Mineralogy.html
- SRTM product DOI: https://doi.org/10.5067/MEASURES/SRTM/SRTMGL1.003
- NASA PDS: https://pds.nasa.gov/
- PDS Geosciences CRISM: https://pds-geosciences.wustl.edu/missions/mro/crism.htm
- PDS Geosciences LRO: https://pds-geosciences.wustl.edu/missions/lro/
- Diviner data/archive and temperature-map references: https://www.diviner.ucla.edu/data and https://pds-geosciences.wustl.edu/missions/lro/diviner.htm
- Planetary Orbital Data Explorer: https://ode.rsl.wustl.edu/
- NASA Solar System Treks: https://trek.nasa.gov/

### API pattern
Use CMR collection search by short name/concept ID, then granule search filtered by bounding box/time/cloud cover; use `earthaccess` for Earthdata authentication/stream/download. For PDS, use ODE/PDS bundle/collection discovery; preserve label files and instrument geometry metadata. For WMTS, inspect capabilities, projection and tile matrix before adding the layer. Use a manifest with URL, provider, retrieved-at, checksum and processing recipe.

### Access/terms
NASA data are generally openly distributed, but product-specific use, attribution, third-party content, user registration and cloud access conditions vary. Check each landing page and data use/citation guidance before publishing a derived result. The MVP should not embed Earthdata tokens in client code.

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
