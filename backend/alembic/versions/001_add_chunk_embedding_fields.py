"""add embedding_model and embedding_dim to chunks

Revision ID: 001_add_chunk_embedding_fields
Revises: 
Create Date: 2026-11-15 09:56:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_add_chunk_embedding_fields'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch_alter_table for SQLite compatibility
    with op.batch_alter_table("chunks", schema=None) as batch_op:
        batch_op.add_column(sa.Column("embedding_model", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("embedding_dim", sa.Integer(), nullable=True))
        batch_op.create_index("ix_chunks_embedding_model", ["embedding_model"])


def downgrade() -> None:
    with op.batch_alter_table("chunks", schema=None) as batch_op:
        batch_op.drop_index("ix_chunks_embedding_model")
        batch_op.drop_column("embedding_dim")
        batch_op.drop_column("embedding_model")
