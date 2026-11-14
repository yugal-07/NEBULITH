# Deployment, security and operations

**Purpose:** Describe local-first hackathon deployment and a safe path to hosted research use with observability and cost guardrails.

## Scope
### In scope
- Static frontend/API deployment, data caching, ingestion observability, secret management and security

### Out of scope
- Cloud-native complexity for demo; public exposure of user uploads by default

## Tasks
- [ ] [TASK:P18-001] Provide local setup with pinned dependencies and sample data.
- [ ] [TASK:P18-002] Keep Earthdata credentials server-side in environment variables.
- [ ] [TASK:P18-003] Set size, type and retention limits for PDF uploads.
- [ ] [TASK:P18-004] Add service health, job logs and source freshness.
- [ ] [TASK:P18-005] Document backup, cache purge and licensing checks.

## Dependencies
- `05-tech-stack.md`
- `16-backend-api-and-data-model.md`

## Acceptance criteria
- [ ] A clean machine can run the demo with documented commands.
- [ ] No secrets are committed or sent to browser bundle.
- [ ] API has input validation, upload limits and useful error handling.

## Anti-slop alignment
antislop-ui performance checks; copywriting no unsupported uptime/security claims; comments state operational constraints.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
