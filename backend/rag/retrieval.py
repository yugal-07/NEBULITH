from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Any
import numpy as np
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.logging import logger
from ..core.providers.embedding import get_embedding_provider
from ..models import Chunk, Document


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str
    document_title: str
    page_number: int | None
    section: str | None
    text: str
    similarity_score: float
    bm25_score: float
    hybrid_score: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "document_title": self.document_title,
            "page_number": self.page_number,
            "section": self.section,
            "text": self.text,
            "similarity_score": round(self.similarity_score, 4),
            "bm25_score": round(self.bm25_score, 4),
            "hybrid_score": round(self.hybrid_score, 4),
        }


def tokenize(text: str) -> list[str]:
    """Simple alphanumeric tokenizer with lowercase normalization."""
    return re.findall(r"\b[a-zA-Z0-9_\-]+\b", text.lower())


class SimpleBM25:
    """Okapi BM25 implementation for candidate chunk ranking."""

    def __init__(self, corpus: list[str], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.doc_lens = [len(tokenize(doc)) for doc in corpus]
        self.avg_dl = sum(self.doc_lens) / max(self.corpus_size, 1)

        # Inverted index & document frequencies
        self.df: dict[str, int] = {}
        self.tf: list[dict[str, int]] = []

        for doc in corpus:
            tokens = tokenize(doc)
            t_counts: dict[str, int] = {}
            for t in tokens:
                t_counts[t] = t_counts.get(t, 0) + 1
            self.tf.append(t_counts)
            for t in t_counts:
                self.df[t] = self.df.get(t, 0) + 1

        # Precompute IDF
        self.idf: dict[str, float] = {}
        for term, freq in self.df.items():
            # Standard Lucene/BM25 IDF formula
            self.idf[term] = math.log(1.0 + (self.corpus_size - freq + 0.5) / (freq + 0.5))

    def score(self, query: str) -> list[float]:
        q_tokens = tokenize(query)
        scores = [0.0] * self.corpus_size

        for term in q_tokens:
            if term not in self.idf:
                continue
            idf_val = self.idf[term]
            for idx in range(self.corpus_size):
                count = self.tf[idx].get(term, 0)
                if count > 0:
                    denom = count + self.k1 * (1.0 - self.b + self.b * (self.doc_lens[idx] / max(self.avg_dl, 1e-6)))
                    scores[idx] += idf_val * (count * (self.k1 + 1.0)) / denom

        return scores


def cosine_similarity(vec_a: list[float] | np.ndarray, vec_b: list[float] | np.ndarray) -> float:
    a = np.asarray(vec_a, dtype=np.float32)
    b = np.asarray(vec_b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def hybrid_retrieve(
    db: Session,
    query: str,
    document_ids: list[str] | None = None,
    top_k: int = 5,
    alpha: float = 0.6,
) -> tuple[list[RetrievedChunk], int]:
    """
    Hybrid vector + keyword retrieval:
    - Filters strictly to chunks with active embedding_model
    - Computes vector cosine similarity
    - Computes BM25 keyword score
    - Blends scores: hybrid = alpha * norm(vec) + (1 - alpha) * norm(bm25)
    Returns (ranked_chunks, total_candidate_chunks).
    """
    active_model = settings.EMBEDDING_MODEL
    query_builder = db.query(Chunk, Document.filename, Document.doc_metadata).join(Document, Chunk.document_id == Document.id)
    query_builder = query_builder.filter(Chunk.embedding_model == active_model)

    if document_ids:
        query_builder = query_builder.filter(Chunk.document_id.in_(document_ids))

    results = query_builder.all()
    total_candidates = len(results)

    if total_candidates == 0:
        return [], 0

    chunks = [r[0] for r in results]
    doc_titles = [
        (r[2].get("title") if isinstance(r[2], dict) and r[2].get("title") else r[1])
        for r in results
    ]

    # 1. Vector Search
    provider = get_embedding_provider()
    query_vec = provider.embed_text(query)
    vec_scores: list[float] = []

    for c in chunks:
        if c.embedding:
            sim = cosine_similarity(query_vec, c.embedding)
            vec_scores.append(max(0.0, sim))
        else:
            vec_scores.append(0.0)

    # 2. BM25 Search
    corpus = [c.text for c in chunks]
    bm25 = SimpleBM25(corpus)
    bm25_scores = bm25.score(query)

    # Normalize scores to [0, 1] range for fair blending
    max_vec = max(vec_scores) if vec_scores and max(vec_scores) > 0 else 1.0
    norm_vec = [s / max_vec for s in vec_scores]

    max_bm25 = max(bm25_scores) if bm25_scores and max(bm25_scores) > 0 else 1.0
    norm_bm25 = [s / max_bm25 for s in bm25_scores]

    combined_items: list[RetrievedChunk] = []
    for idx in range(total_candidates):
        c = chunks[idx]
        v_score = vec_scores[idx]
        b_score = bm25_scores[idx]
        h_score = (alpha * norm_vec[idx]) + ((1.0 - alpha) * norm_bm25[idx])

        combined_items.append(
            RetrievedChunk(
                chunk_id=c.id,
                document_id=c.document_id,
                document_title=doc_titles[idx],
                page_number=c.page_number,
                section=c.section,
                text=c.text,
                similarity_score=v_score,
                bm25_score=b_score,
                hybrid_score=h_score,
            )
        )

    # Sort descending by hybrid score
    combined_items.sort(key=lambda item: item.hybrid_score, reverse=True)
    return combined_items[:top_k], total_candidates
