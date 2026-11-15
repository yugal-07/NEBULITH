#!/usr/bin/env python3
"""
scripts/reembed.py
Re-embeds all or outdated chunks in the database with the currently configured embedding provider.
Updates chunk.embedding, chunk.embedding_model, and chunk.embedding_dim.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from sqlalchemy.orm import Session

# Ensure backend is on sys.path
BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.core.config import settings
from backend.core.database import get_db_context
from backend.core.logging import logger
from backend.core.providers.embedding import get_embedding_provider
from backend.models import Chunk


def reembed_chunks(force_all: bool = False, batch_size: int = 32, db: Session | None = None) -> int:
    provider = get_embedding_provider()
    target_model = settings.EMBEDDING_MODEL
    target_dim = provider.dimension

    logger.info(f"Using embedding provider: {type(provider).__name__} (model: {target_model}, dim: {target_dim})")

    if db is not None:
        return _run_reembed(db, provider, target_model, target_dim, force_all, batch_size)
    else:
        with get_db_context() as session:
            return _run_reembed(session, provider, target_model, target_dim, force_all, batch_size)


def _run_reembed(db: Session, provider, target_model: str, target_dim: int, force_all: bool, batch_size: int) -> int:
    query = db.query(Chunk)
    if not force_all:
        query = query.filter(
            (Chunk.embedding_model != target_model) | (Chunk.embedding == None) | (Chunk.embedding_model == None)
        )

    total_chunks = query.count()
    if total_chunks == 0:
        logger.info("No chunks require re-embedding.")
        return 0

    logger.info(f"Found {total_chunks} chunks to embed/re-embed...")

    # Process in batches
    chunks = query.all()
    updated_count = 0

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c.text for c in batch]
        embeddings = provider.embed_batch(texts)

        for chunk, emb in zip(batch, embeddings):
            chunk.embedding = emb
            chunk.embedding_model = target_model
            chunk.embedding_dim = target_dim
            updated_count += 1

        db.commit()
        logger.info(f"Re-embedded {min(i + batch_size, total_chunks)}/{total_chunks} chunks...")

    logger.info(f"Successfully re-embedded {updated_count} chunks with model '{target_model}'.")
    return updated_count


def main():
    parser = argparse.ArgumentParser(description="Re-embed chunks in NEBULITH database.")
    parser.add_argument("--all", action="store_true", help="Force re-embedding of ALL chunks, regardless of current model")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size for embedding generation")
    args = parser.parse_args()

    reembed_chunks(force_all=args.all, batch_size=args.batch_size)


if __name__ == "__main__":
    main()
