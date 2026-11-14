# Terracroma.ai Feature Priority Matrix

This matrix is the scope guard for the hackathon prototype. Priority is based on whether a feature completes the challenge story, whether it can be demonstrated with verified data, and whether it can be implemented reliably in 24–48 hours.

| Feature | Priority | Hackathon decision | Reason / exit condition |
|---|---|---|---|
| Mission Workspace and target AOI | P0 | Build | Required entry point for the judge journey. |
| Curated Earth candidate discovery | P0 | Build | Core challenge outcome. Limit to 2–3 AOIs with verified data. |
| Deterministic explainable matching | P0 | Build | Core scientific value; scores must be reproducible. |
| Evidence/provenance panel | P0 | Build | Prevents unsupported or opaque claims. |
| Earth–Moon–Mars transferability gaps | P0 | Build | Strong scientific differentiator; irreducible differences explicit. |
| 2D map and AOI/layer selection | P0 | Build | Makes candidate discovery spatially understandable. |
| One 3D DEM terrain scene | P0 | Build narrowly | Visual impact; one preprocessed AOI only. |
| Rover route rehearsal | P1 | Build if P0 stable | Bounded route cost using slope/roughness proxies; no safety certification. |
| Comparison Studio | P1 | Build | Makes evidence comparison understandable. |
| Reproducible report + CSV/GeoJSON | P1 | Build | Strong tangible output for judges. |
| Resource/ISRU proxy explorer | P2 | Minimal if data ready | Only show a verified mineral/illumination proxy; no reserve claims. |
| Multi-site experiment coverage | P2 | Demo as stretch | Strong novelty; use explicit experiment-condition coverage model. |
| Autonomous discovery agent | P2 | Defer | Tool-assisted evidence retrieval after deterministic pipeline works. |
| Planetary Time Machine | P2 | Defer | Requires temporal products and comparable time windows. |
| Counterfactual mission lab | P2 | Defer | Weight/constraint sensitivity can be a simple stretch interaction. |
| Cave/subsurface analogs | P3 | Defer | Sparse global evidence; curated research catalogue only. |
| Astronaut EVA/habitat operations | P3 | Defer | Requires data/model validation beyond rover MVP. |
| Climate drift monitor | P3 | Defer | Longitudinal analysis is not needed for core demo. |
| XR/immersive exploration | P3 | Do not build | High effort, low scientific value for first prototype. |
| Full global live scanning | P3 | Do not build | Unfeasible and risks fake coverage claims. |
| High-fidelity rover physics | P3 | Do not build | Not defensible in hackathon time; use bounded transparent proxy. |
| Production authentication/multi-tenant accounts | P3 | Do not build | Local study persistence is sufficient for demo. |

## Definition of MVP complete
P0 features work end-to-end. P1 features are included only if they do not destabilize P0. P2/P3 work must not delay acceptance tests, offline fallback or demo rehearsal.
