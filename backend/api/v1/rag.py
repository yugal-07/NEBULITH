from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ...core.config import settings
from ...core.database import get_db
from ...core.errors import BadRequestError
from ...rag.retrieval import hybrid_retrieve
from ...rag.generator import generate_grounded_answer

router = APIRouter(prefix="/rag", tags=["RAG & Citations"])


class RagQueryRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000, description="Scientific question about uploaded documents")
    document_ids: list[str] | None = Field(default=None, description="Optional list of document IDs to restrict search")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of candidate chunks to retrieve")


class CitationResponse(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    page_number: int | None
    quote: str
    verified: bool


class RetrievedChunkResponse(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    page_number: int | None
    section: str | None
    text: str
    similarity_score: float
    bm25_score: float
    hybrid_score: float


class RagQueryResponse(BaseModel):
    question: str
    answer: str
    citations: list[CitationResponse]
    retrieved_chunks: list[RetrievedChunkResponse]
    active_embedding_model: str
    total_chunks_searched: int


class RagConfigResponse(BaseModel):
    active_llm_provider: str
    is_real_llm_configured: bool
    embedding_model: str
    embedding_dimension: int
    max_top_k: int


@router.get("/config", response_model=RagConfigResponse)
def get_rag_config() -> RagConfigResponse:
    """
    Returns active RAG and LLM provider configuration for the frontend UI.
    Identifies whether a real LLM is configured or running in mock mode.
    Never exposes API keys.
    """
    has_real_key = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY)
    is_real = has_real_key and settings.LLM_PROVIDER.lower() != "mock"

    return RagConfigResponse(
        active_llm_provider=settings.LLM_PROVIDER,
        is_real_llm_configured=is_real,
        embedding_model=settings.EMBEDDING_MODEL,
        embedding_dimension=settings.EMBEDDING_DIMENSION,
        max_top_k=20,
    )


@router.post("/query", response_model=RagQueryResponse)
def query_rag(payload: RagQueryRequest, db: Session = Depends(get_db)) -> RagQueryResponse:
    """
    Perform hybrid vector + keyword retrieval and generate an answer
    grounded strictly in the retrieved chunks with verified quotes and citations.
    """
    question = payload.question.strip()
    if not question:
        raise BadRequestError("Question cannot be empty.")

    # 1. Hybrid retrieval (dense cosine + sparse BM25)
    retrieved, total_searched = hybrid_retrieve(
        db=db,
        query=question,
        document_ids=payload.document_ids,
        top_k=payload.top_k,
        alpha=0.6,
    )

    # 2. Grounded answer generation and quote verification
    answer, citations = generate_grounded_answer(
        question=question,
        chunks=retrieved,
    )

    return RagQueryResponse(
        question=question,
        answer=answer,
        citations=[CitationResponse(**c.to_dict()) for c in citations],
        retrieved_chunks=[RetrievedChunkResponse(**r.to_dict()) for r in retrieved],
        active_embedding_model=settings.EMBEDDING_MODEL,
        total_chunks_searched=total_searched,
    )
