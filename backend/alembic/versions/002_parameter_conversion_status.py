"""Persist explicit unit-conversion failures.

Revision ID: 002_parameter_conversion_status
Revises: 001_add_chunk_embedding_fields
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "002_parameter_conversion_status"
down_revision = "001_add_chunk_embedding_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {column["name"] for column in inspect(op.get_bind()).get_columns("extracted_parameters")}
    with op.batch_alter_table("extracted_parameters") as batch_op:
        if "conversion_failed" not in columns:
            batch_op.add_column(sa.Column("conversion_failed", sa.Boolean(), nullable=False, server_default=sa.false()))
        if "conversion_error" not in columns:
            batch_op.add_column(sa.Column("conversion_error", sa.Text(), nullable=True))


def downgrade() -> None:
    columns = {column["name"] for column in inspect(op.get_bind()).get_columns("extracted_parameters")}
    with op.batch_alter_table("extracted_parameters") as batch_op:
        if "conversion_error" in columns:
            batch_op.drop_column("conversion_error")
        if "conversion_failed" in columns:
            batch_op.drop_column("conversion_failed")
