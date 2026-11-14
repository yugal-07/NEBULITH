# Scientific document ingestion

**Purpose:** Extract PDF text, metadata, tables and figure captions with traceable references for the RAG library.

## Scope
### In scope
- Implement the scientific document ingestion capability: Extract PDF text, metadata, tables and figure captions with traceable references for the RAG library.
- Own the interaction states, inputs/outputs, validation rules and evidence lineage specific to this component.
- In-scope implementation slices: Validate PDF type/size and scan status.; Extract text/table/caption with page markers.; Use OCR only for scanned pages and mark OCR confidence.

### Out of scope
- Upstream capabilities owned by: 37-research-rag-and-paper-assistant.md.
- Downstream capabilities assigned to separate component plans.
- Operational safety certification or planetary equivalence claims not supported by validated evidence.

## Tasks
- [ ] [TASK:P38-001] Validate PDF type/size and scan status.
- [ ] [TASK:P38-002] Extract text/table/caption with page markers.
- [ ] [TASK:P38-003] Use OCR only for scanned pages and mark OCR confidence.
- [ ] [TASK:P38-004] Allow human correction of extracted criteria.

## Dependencies
- `37-research-rag-and-paper-assistant.md`

## Acceptance criteria
- [ ] Extracted parameters link to exact page/figure/table.
- [ ] OCR-derived text is not treated as fact without review.

## Anti-slop alignment
antislop-code: preserve non-obvious limitations; copywriting factual restraint.

## Estimated effort
M

## Status
**Status:** Not started

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
