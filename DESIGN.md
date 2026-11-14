# NEBULITH Design System

## Authority and reconciliation
The current NEBULITH interface and user screenshot define the visual shell: dark planetary canvas, compact floating oval navigation, oversized left editorial headline, planetary globe at right, compact contextual controls, and slim bottom status strip. The supplied Terracroma package is a scientific workflow specification, not a visual replacement. Its permanent left rail is not adopted. Analyze can use compact contextual subnavigation without a persistent sidebar. The earlier Vana-inspired direction remains: near-black/navy surfaces, electric blue/violet accents, crisp typography, restrained borders and generous negative space. Keep Inter for UI and DM Mono for coordinates and technical metadata where already used. Preserve NEBULITH and Explore Worlds identity.

## Color, type and accessibility
- Canvas: deep navy/near-black; layered charcoal surfaces with subtle translucent borders.
- Brand highlight: electric periwinkle/violet. Never use color alone for status.
- Scientific visualization: separately documented palettes with legend, units and range; brand accent must not imply significance.
- High contrast text, visible keyboard focus, keyboard operation, reduced motion, responsive layouts.

## Three distinct spatial views
1. **Global planetary globe** (`PlanetaryGlobe`): orientation across Earth, Moon and Mars. Solar System Scope textures are illustrative basemaps only, never analysis products.
2. **2D spatial map** (MapLibre): AOI geometry and verified raster/vector layers with source, date, coverage and legend. Do not imply unsupported planetary basemap coverage.
3. **Bounded 3D terrain scene** (DEM based): selected, cached, documented DEM region. Show dataset, vertical reference, resolution and missing-data coverage. Never substitute the globe texture or synthetic terrain for analysis.

## Evidence and science presentation
- Missing/unprocessed/unsupported values render as **Not available** or a precise coverage state, never zero.
- Results carry source/provenance, units, spatial and temporal context, uncertainty where available, and processing/model version.
- Distinguish measured observation, derived product, model output, literature claim and illustration.
- Earth analogs are comparisons, not environmental equivalents to Moon or Mars. Expose transferability conditions and irreducible differences.
- Similarity scores are deterministic, versioned, explainable and based only on compatible features. LLM narrative stays separate from scores.
- Route rehearsal is not a safety certification. Do not imply NASA endorsement or affiliation.

## Component and responsive rules
Preserve floating header, body selector, search, globe controls, location panel and bottom status. Keep panels compact; put deep evidence in focused views. Every layer has a name, source/status, toggle and accessible label. Loading, stale, offline, missing coverage and errors are distinct. Deferred capabilities are labeled roadmap and are not working controls. At narrow widths, collapse navigation accessibly, move context below the visual, keep search/body selection available, and avoid overlays obscuring AOI/map controls.
