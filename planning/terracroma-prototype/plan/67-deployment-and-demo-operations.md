# Deployment and Demo Operations

**Purpose:** Make the prototype reproducible locally and resilient during the live hackathon demonstration.

## Scope
### In scope
- Local development, environment variables, deployment options, data caching, health checks, rollback and demo-day runbook.
- Free-tier-first deployment with local fallback.
### Out of scope
- Kubernetes, paid managed GIS, production SRE and secrets in client bundles.

## Recommended deployment shape
- Frontend: React + TypeScript + Vite static build, free static host if current limits permit or local serving.
- Backend: FastAPI; free container host only if current limits permit; local mode remains fallback.
- Persistence: SQLite for hackathon study metadata; local GeoJSON/COG files for curated data; PostGIS later.
- Cache selected AOIs and derived layers before demo day. Do not download global archives at venue.
- Keep secrets backend-only; `.env.example` uses dummy values only.

## Environment variables
`APP_ENV`, `API_BASE_URL`, `DATA_DIR`, `DATABASE_URL`, `ENABLE_DEMO_FIXTURES=false`, `NASA_EARTHDATA_USERNAME`, `NASA_EARTHDATA_PASSWORD` (only if required), `LOG_LEVEL`. Never expose credentials in frontend bundle.

## Local run target
Verify these commands against actual generated project layout before marking complete:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# separate terminal
cd frontend
npm ci
npm run dev
```
If the coding agent chooses another workspace layout, update root README and this file together.

## Deployment runbook
1. Pin dependencies and build artifacts.
2. Configure backend secrets in host settings.
3. Deploy backend and verify `/api/v1/health`.
4. Deploy frontend with correct API base URL.
5. Verify CORS, API contract and a complete saved study.
6. Warm/cache demo data.
7. Run acceptance tests against deployed URL.
8. Keep local app and cached data as fallback.

## Demo-day operations
- Bring local repo and cached data on demo laptop.
- Test charger, browser, display and offline startup.
- Keep backup screen recording and exported report.
- Do not depend on Earthdata login, external AI APIs or tile endpoints during judge presentation.
- Show data timestamp/cache label.

## Tasks
- [ ] [TASK:OPS-001] Create `.env.example` and document secret handling.
- [ ] [TASK:OPS-002] Implement health/readiness endpoints and visible build version.
- [ ] [TASK:OPS-003] Verify local start/build commands on a clean clone.
- [ ] [TASK:OPS-004] Configure public deployment only if free-tier limits and connectivity make it reliable.
- [ ] [TASK:OPS-005] Cache demo data and test offline fallback.
- [ ] [TASK:OPS-006] Execute demo-day runbook and preserve backup artifacts.

## Dependencies
- `05-tech-stack.md`
- `18-deployment-security-and-operations.md`
- `62-hackathon-mvp-build-specification.md`
- `66-prototype-acceptance-tests.md`

## Acceptance criteria
- Clean clone starts using runbook.
- No secret is committed or bundled into browser.
- Health check, frontend build and one full demo workflow pass.
- Offline fallback works on presentation machine.
- Local demo remains available even if deployment is unavailable.

## Anti-slop alignment
- antislop R-17: no fake live/uptime claims.
- antislop R-26/R-35: controls work and delivered experience is tested.
- UI UX Pro Max performance guidance: avoid oversized payloads and blocking main-thread processing.

## Estimated effort
M

## Status
**Status:** Not started
