"""create wallet exposure tables

Revision ID: 20260919_0002
Revises: 20260918_0001
Create Date: 2026-09-19
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260919_0002"
down_revision: str | Sequence[str] | None = "20260918_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tracked_wallets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "address_family",
            sa.String(length=16),
            server_default="evm",
            nullable=False,
        ),
        sa.Column("address", sa.String(length=42), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=True),
        sa.Column(
            "sync_status",
            sa.String(length=16),
            server_default="never",
            nullable=False,
        ),
        sa.Column("last_sync_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_sync_error_code", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "sync_status IN ('never', 'success', 'failed')",
            name="ck_tracked_wallet_sync_status",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "address_family",
            "address",
            name="uq_tracked_wallet_user_family_address",
        ),
    )
    op.create_index(
        op.f("ix_tracked_wallets_user_id"),
        "tracked_wallets",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "wallet_positions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("wallet_id", sa.Uuid(), nullable=False),
        sa.Column("network_id", sa.String(length=64), nullable=False),
        sa.Column("asset_kind", sa.String(length=16), nullable=False),
        sa.Column("asset_reference", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("symbol", sa.String(length=64), nullable=True),
        sa.Column("decimals", sa.Integer(), nullable=True),
        sa.Column("raw_balance", sa.Numeric(precision=78, scale=0), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "asset_kind IN ('native', 'erc20')",
            name="ck_wallet_position_asset_kind",
        ),
        sa.CheckConstraint(
            "raw_balance >= 0",
            name="ck_wallet_position_raw_balance_nonnegative",
        ),
        sa.CheckConstraint(
            "decimals IS NULL OR (decimals >= 0 AND decimals <= 255)",
            name="ck_wallet_position_decimals",
        ),
        sa.ForeignKeyConstraint(
            ["wallet_id"],
            ["tracked_wallets.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "wallet_id",
            "network_id",
            "asset_reference",
            name="uq_wallet_position_identity",
        ),
    )
    op.create_index(
        op.f("ix_wallet_positions_wallet_id"),
        "wallet_positions",
        ["wallet_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_wallet_positions_wallet_id"), table_name="wallet_positions")
    op.drop_table("wallet_positions")
    op.drop_index(op.f("ix_tracked_wallets_user_id"), table_name="tracked_wallets")
    op.drop_table("tracked_wallets")
