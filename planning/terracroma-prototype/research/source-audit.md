# Research source audit — Terracroma.ai

**Research snapshot:** 2026-11-14. URLs should be rechecked before final submission because catalogs and product versions change.

## Official challenge page
**NASA Space Apps Challenge 2026:** https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/

The indexed official page lists the title “Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars”; difficulty labels Advanced, Intermediate and Beginner/Youth; subjects Earth Science, Planets & Moons, Software and Space Exploration. The challenge describes site selection using topography, geology, environment and resources; cites Atacama Desert, Haughton Crater and Death Valley as existing analog examples; notes those sites are not entirely well characterized; and asks teams to use open Earth, Moon and Mars data from NASA and other agencies to identify and characterize new terrestrial analogs, including deserts, polar regions, volcanic/arid terrains and caves, then present findings as a map, visualization or other tool.

## Official resources tab and video limitation
The exact URL `https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/?tab=resources` was attempted but returned a cache-miss error in the page access layer. Search indexing returned the challenge description but did not expose the full resource-tab contents, an embedded YouTube URL or a verifiable transcript. We therefore **have not verified or watched the specific video**. Do not cite a guessed video. This is a source limitation, not proof that the resources tab lacks a video. Before a public demo/pitch, a teammate should open the official tab in a normal browser, save exact URLs and record the video title/channel/date/transcript or timestamped notes.

## Secondary resource compilation (not official)
An independent Space Data Atlas page for this challenge listed six starter resources: EMIT L2B mineral maps, SRTMGL1 1 arc-second, HLSL30, CRISM MTRDR, Mars Trek WMTS, and LRO Diviner temperature maps. It explicitly disclaims NASA/Space Apps affiliation. Source: https://spacedata.swapniltamse.com/challenges/earth-analogs-moon-mars/ . Use as a shortlist, then verify each product at its primary archive.

## Primary datasets and documentation verified
### Earth
- **EMIT L2B Mineral Identification (EMITL2BMIN V001):** DOI https://doi.org/10.5067/EMIT/EMITL2BMIN.001 . NASA Earthdata metadata reports 60 m nominal spatial resolution, global land extent between 54°N and 54°S, active collection and concept ID `C2408034484-LPCLOUD`. The product includes mineral identification/band depth and uncertainty; data are spatially raw/non-orthocorrected in the published product description. NASA LP DAAC tutorial: https://nasa.github.io/LPDAAC-Data-Resources/external/Finding_EMIT_L2B_Data.html . Mineral interpretation cautions/tutorial: https://nasa.github.io/LPDAAC-Data-Resources/external/Working_with_EMIT_L2B_Mineralogy.html .
- **SRTMGL1 V003:** DOI https://doi.org/10.5067/MEASURES/SRTM/SRTMGL1.003 . NASA/LP DAAC describes near-global 1 arc-second (~30 m) elevation data covering 60°N to 56°S and observations from the 2000 SRTM mission. It is not suitable for high-latitude polar analog coverage. Product record: https://data.nasa.gov/dataset/nasa-shuttle-radar-topography-mission-global-1-arc-second-number-v003-8ee6c .
- **HLSL30 / HLSS30:** harmonized Landsat/Sentinel-2 surface reflectance for repeat observations; Earthdata/LP DAAC access. Product guide: https://github.com/nasa/LPDAAC-Data-Resources/blob/main/guides/lp_product_guide.md . Earthdata catalog: https://search.earthdata.nasa.gov/ . Confirm current collection versions, cloud masks and COG access before use.

### Mars
- **CRISM:** visible/infrared hyperspectral mapper for Martian geology and composition. The PDS Geosciences Node announced migration of CRISM LDR and TER products to PDS4 in 2026 and notes CRISM L-data collection stopped in 2018 due to cooler failure. Documentation and archive entry: https://pds-geosciences.wustl.edu/missions/mro/crism.htm . CRISM MRDR bundle record: https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn%3Anasa%3Apds%3Amro_crism_mrdr&version=1.0 .
- **Mars Trek:** https://trek.nasa.gov/ . Inspect WMTS capabilities and projection per layer. Do not assume visual mosaics have matching resolution or source epochs.
- **MOLA:** use PDS/Mars Trek products for global context and terrain derivatives; record the exact product version and grid spacing selected.

### Moon
- **LRO archives:** PDS Geosciences LRO page lists LOLA, Diviner, LEND, CRaTER, LROC and other instrument archives; https://pds-geosciences.wustl.edu/missions/lro/ .
- **Diviner:** UCLA team data page states reduced data records were reprocessed to RDR 3.1 and lists global/polar temperature maps plus references; https://www.diviner.ucla.edu/data . PDS entry: https://pds-geosciences.wustl.edu/missions/lro/diviner.htm . The PDS page describes Diviner as mapping lunar surface temperature at approximately 500 m horizontal scale.
- **LOLA / LROC:** use PDS/ODE for exact product lookup and preserve instrument geometry and map projection metadata. NASA LRO data product overview: https://science.nasa.gov/mission/lro/data-products/ .

## Data access patterns
- **CMR:** https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html . Search collections by short name/concept ID and granules by bounding box/time/cloud cover.
- **earthaccess:** https://earthaccess.readthedocs.io/ . Python helper for CMR discovery and Earthdata Login-authenticated streaming/download. Keep tokens server-side.
- **PDS/ODE:** use PDS bundle and collection discovery for planetary archives; capture labels and product documentation. ODE: https://ode.rsl.wustl.edu/ .
- **WMTS:** fetch and parse capabilities, coordinate system, tile matrix and layer attribution before use.

## Data limitations and harmonization risks
1. Earth and planetary products differ in sensor, pixel scale, processing history and spectral response. Do not compare raw pixel values across sensors without a justified harmonization method.
2. SRTM has a latitude coverage gap at high latitudes. Polar analog work needs a different DEM source (e.g., locally selected Copernicus DEM/ArcticDEM/REMA after product/licensing verification).
3. EMIT mineral identification is a retrieval product with uncertainty and processing caveats, not a direct field assay or mineral-resource reserve estimate.
4. CRISM and EMIT spectral coverage, observing geometry, calibration and processing differ. Compare robust mineral classes only when instrument/product methodology supports it.
5. Diviner and Earth thermal observations have different temporal/local-time sampling and physical boundary conditions. Compare selected descriptors with caveats.
6. Gravity, near-vacuum and radiation cannot be simulated by an outdoor Earth analog location; list as facility-dependent or irreducible.

## Relevant repositories/skills
- Anti-Slop: https://github.com/miqdadbadjuber/anti-slop ; public README lists the core `antislop` plus five focused skills: `antislop-ui`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, `antislop-code`. Six user-uploaded files map to these six names.
- UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/.claude/skills ; main skill: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md ; design routing: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/design/references/design-routing.md ; UI quick reference: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/references/quick-reference.md .

## Source claim labels for the application
`official_challenge` = text on the Space Apps challenge page; `primary_data` = NASA/agency dataset; `secondary_guide` = independent dataset recommendation; `user_proposal` = feature in uploaded Terracroma document; `derived` = metric computed by documented code; `modelled` = algorithm estimate; `expert_annotation` = reviewed qualitative rule; `illustrative` = demo-only mock value.
