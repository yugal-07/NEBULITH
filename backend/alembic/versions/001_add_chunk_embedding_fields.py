"""add embedding_model and embedding_dim to chunks

Revision ID: 001_add_chunk_embedding_fields
Revises: 
Create Date: 2026-11-15 09:56:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from backend.models import Base  # imports all model tables into metadata

revision: str = '001_add_chunk_embedding_fields'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This repository's first migration predates a baseline migration. Create
    # the complete schema on a fresh database; on an existing schema continue
    # with the incremental chunk-column upgrade below.
    bind = op.get_bind()
    if not inspect(bind).has_table("chunks"):
        if bind.dialect.name == "postgresql":
            op.execute("CREATE EXTENSION IF NOT EXISTS vector")
        Base.metadata.create_all(bind=bind)

    # Use batch_alter_table for SQLite compatibility
    columns = {column["name"] for column in inspect(bind).get_columns("chunks")}
    if "embedding_model" not in columns or "embedding_dim" not in columns:
        with op.batch_alter_table("chunks", schema=None) as batch_op:
            if "embedding_model" not in columns:
                batch_op.add_column(sa.Column("embedding_model", sa.String(length=100), nullable=True))
                batch_op.create_index("ix_chunks_embedding_model", ["embedding_model"])
            if "embedding_dim" not in columns:
                batch_op.add_column(sa.Column("embedding_dim", sa.Integer(), nullable=True))


def downgrade() -> None:
    # Fresh schemas are removed only by a full DB reset; this migration does
    # not try to infer whether it created the baseline or upgraded a legacy DB.
    columns = {column["name"] for column in inspect(op.get_bind()).get_columns("chunks")}
    with op.batch_alter_table("chunks", schema=None) as batch_op:
        if "ix_chunks_embedding_model" in {index["name"] for index in inspect(op.get_bind()).get_indexes("chunks")}:
            batch_op.drop_index("ix_chunks_embedding_model")
        if "embedding_dim" in columns:
            batch_op.drop_column("embedding_dim")
        if "embedding_model" in columns:
            batch_op.drop_column("embedding_model")
