# API Contracts and Data Models

**Purpose:** Define a stable API surface between React client and scientific backend.

## Scope
### In scope
- Typed contracts for studies, target AOIs, candidates, scoring, transferability, routes and exports.
- Stable IDs, units, provenance and evidence-state fields.
- Local demo mode and deterministic errors.
### Out of scope
- Public unauthenticated write APIs, realtime streaming, microservices and LLM-generated numerical values.

## API conventions
- Base path `/api/v1`; JSON over HTTPS; GeoJSON for geometry.
- UUIDs for persisted study/candidate IDs; stable IDs for source products.
- Scientific fields carry `value`, `unit`, `evidence_type`, `source_refs`, dates, `spatial_resolution_m`, `uncertainty` and `coverage_status` where applicable.
- Null means unknown/unavailable; never coerce null to zero.
- Structured errors: `code`, `message`, `details`, `request_id`.

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service health/build version |
| GET | `/api/v1/sources` | Available products and status |
| GET | `/api/v1/targets?body=mars` | Curated target AOIs |
| POST | `/api/v1/studies` | Create study |
| GET | `/api/v1/studies/{id}` | Retrieve study |
| PATCH | `/api/v1/studies/{id}` | Update configuration |
| POST | `/api/v1/studies/{id}/discover` | Run deterministic matching |
| GET | `/api/v1/studies/{id}/candidates` | Candidate results |
| GET | `/api/v1/studies/{id}/candidates/{candidate_id}` | Candidate evidence |
| POST | `/api/v1/studies/{id}/compare` | Comparison model |
| POST | `/api/v1/studies/{id}/transferability` | Experiment gap analysis |
| POST | `/api/v1/studies/{id}/routes` | Bounded route calculation |
| POST | `/api/v1/studies/{id}/reports` | Generate report snapshot |
| GET | `/api/v1/exports/{export_id}` | Download export |

## Canonical models
- `EvidenceValue`: value/null, unit, evidence_type (`observed|derived|modeled|inferred|qualitative|synthetic_demo`), coverage_status, source_refs, resolution, temporal range, uncertainty, processing_version.
- `Candidate`: candidate_id, name, GeoJSON geometry, region_type, features, nullable score, score_config_id, nullable confidence, coverage_fraction, limitations, source_refs.
- `Study`: study_id, title, target_body, target_region_id, mission_profile_id, weights, constraints, candidate_ids, timestamps, data_snapshot_id, algorithm_version.
- `TransferabilityCondition`: condition_id, experiment, target_condition, classification (`transferable|partial|non_transferable|unknown`), rationale, earth_test_method, required_complement, evidence_refs, limitations.
- `RouteResult`: route_id, geometry, distance_m, cost_components, warnings, checkpoints, algorithm_version, assumptions, `not_a_safety_certification=true`.

## Tasks
- [ ] [TASK:API-001] Define Pydantic models for the canonical data types.
- [ ] [TASK:API-002] Implement endpoints required by the MVP journey.
- [ ] [TASK:API-003] Publish OpenAPI schema and validate frontend TypeScript types.
- [ ] [TASK:API-004] Validate units, evidence types, nulls and source references.
- [ ] [TASK:API-005] Add contract tests for success, partial coverage and unavailable-source responses.

## Dependencies
- `04-architecture.md`
- `16-backend-api-and-data-model.md`
- `09-scientific-model-and-scoring.md`
- `51-provenance-and-citations.md`

## Acceptance criteria
- Frontend/backend DTOs agree.
- Missing data remain null with explicit coverage status.
- Every numeric feature has unit and evidence type.
- OpenAPI and contract tests pass.
- No secret/provider token is exposed to browser.

## Anti-slop alignment
- antislop R-17/R-36: contracts prevent fabricated or unverifiable claims.
- antislop-code: comments preserve domain constraints only.
- UI UX Pro Max: typed interfaces and predictable states.

## Estimated effort
M

## Status
**Status:** Not started
