# Technology stack and tradeoffs

**Purpose:** Choose a low-cost implementation stack appropriate for a 24–48 hour geospatial demo that can evolve into a research platform.

## Scope
### In scope
- Web frontend, map/3D, scientific backend, geospatial storage and automation
- Open formats and repeatable local development
- Performance and data access boundaries

### Out of scope
- Premature Kubernetes, costly managed GIS and paid AI dependencies
- Using raw satellite products directly in browser without preprocessing

## Tasks
- [ ] [TASK:P05-001] Use React + TypeScript + Vite for the interactive client.
- [ ] [TASK:P05-002] Use FastAPI with typed DTOs for scientific and discovery endpoints.
- [ ] [TASK:P05-003] Use GeoJSON for vector features, COG/GeoTIFF and Zarr for rasters, STAC/CMR metadata for cataloging.
- [ ] [TASK:P05-004] Use PostGIS for candidate geometries/metadata when persistence is required; use local files/SQLite for hackathon demo.
- [ ] [TASK:P05-005] Use MapLibre GL JS for the 2D map and Three.js for one preprocessed DEM-based 3D terrain scene; defer a full planetary globe engine until after the hackathon MVP.
- [ ] [TASK:P05-006] Pin dependencies and document memory, bandwidth and storage costs.

## Dependencies
- `04-architecture.md`

## Hackathon implementation decision
- Frontend: React + TypeScript + Vite.
- 2D map: MapLibre GL JS, with GeoJSON AOIs and raster/tile overlays where access is verified.
- 3D MVP: Three.js renders a single local/preprocessed DEM heightfield for one AOI. It is a terrain scene, not a claim of a complete photorealistic digital twin.
- Backend: FastAPI + Pydantic; Python handles raster processing and deterministic scoring.
- Geospatial processing: Rasterio/rioxarray/xarray, GeoPandas, Shapely and pyproj only as needed; pin versions and test native dependencies early.
- Storage: SQLite + local files for the hackathon; PostGIS is a stretch/future upgrade.
- API: REST `/api/v1`, OpenAPI-generated/validated TypeScript DTOs.
- Charts: lightweight chart library only for explainable score breakdowns; avoid decorative dashboards.
- AI: optional research/explanation assistant after deterministic matching works; never controls numerical scores.

## Acceptance criteria
- [ ] Stack has no mandatory paid service and runs locally.
- [ ] Raster processing remains in Python, not main browser thread.
- [ ] MVP can run against a small preprocessed sample without requiring global downloads.

## Anti-slop alignment
antislop-ui performance: reserve media dimensions and avoid blocking scripts; layoutmobile: content-driven breakpoints; UI UX Pro Max: 22 stack-specific implementation profiles, optimize to chosen React stack.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
