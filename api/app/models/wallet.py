from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.domain.wallet import EVM_ADDRESS_FAMILY

if TYPE_CHECKING:
    from app.models.user import User


class TrackedWallet(TimestampMixin, Base):
    __tablename__ = "tracked_wallets"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "address_family",
            "address",
            name="uq_tracked_wallet_user_family_address",
        ),
        CheckConstraint(
            "sync_status IN ('never', 'success', 'failed')",
            name="ck_tracked_wallet_sync_status",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    address_family: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default=EVM_ADDRESS_FAMILY,
        server_default=EVM_ADDRESS_FAMILY,
    )
    address: Mapped[str] = mapped_column(String(42), nullable=False)
    label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sync_status: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="never",
        server_default="never",
    )
    last_sync_attempt_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_sync_error_code: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    user: Mapped[User] = relationship(back_populates="tracked_wallets")
    positions: Mapped[list[WalletPosition]] = relationship(
        back_populates="wallet",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class WalletPosition(TimestampMixin, Base):
    __tablename__ = "wallet_positions"
    __table_args__ = (
        UniqueConstraint(
            "wallet_id",
            "network_id",
            "asset_reference",
            name="uq_wallet_position_identity",
        ),
        CheckConstraint(
            "asset_kind IN ('native', 'erc20')",
            name="ck_wallet_position_asset_kind",
        ),
        CheckConstraint(
            "raw_balance >= 0",
            name="ck_wallet_position_raw_balance_nonnegative",
        ),
        CheckConstraint(
            "decimals IS NULL OR (decimals >= 0 AND decimals <= 255)",
            name="ck_wallet_position_decimals",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    wallet_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("tracked_wallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    network_id: Mapped[str] = mapped_column(String(64), nullable=False)
    asset_kind: Mapped[str] = mapped_column(String(16), nullable=False)
    asset_reference: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    symbol: Mapped[str | None] = mapped_column(String(64), nullable=True)
    decimals: Mapped[int | None] = mapped_column(Integer, nullable=True)
    raw_balance: Mapped[Decimal] = mapped_column(
        Numeric(precision=78, scale=0),
        nullable=False,
    )
    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    wallet: Mapped[TrackedWallet] = relationship(back_populates="positions")
