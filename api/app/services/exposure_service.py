from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy.orm import Session

from app.domain.wallet import ETHEREUM_MAINNET_NETWORK_ID
from app.models.user import User
from app.models.wallet import WalletPosition
from app.providers.base import TokenPriceProvider
from app.repositories.wallet_repository import WalletRepository
from app.schemas.exposure import (
    ExposurePosition,
    ExposureReadModel,
    ExposureSummary,
    ExposureWallet,
)


@dataclass
class _Aggregate:
    network_id: str
    asset_kind: str
    asset_reference: str
    name: str | None
    symbol: str | None
    decimals: int | None
    raw_balance: Decimal


class ExposureService:
    def __init__(
        self,
        *,
        repository: WalletRepository,
        price_provider: TokenPriceProvider,
    ) -> None:
        self._repository = repository
        self._price_provider = price_provider

    def get_exposure(
        self,
        *,
        session: Session,
        user: User,
    ) -> ExposureReadModel:
        wallets = self._repository.list_for_user(
            session=session,
            user_id=user.id,
        )
        stored_positions = self._repository.list_positions_for_user(
            session=session,
            user_id=user.id,
        )

        aggregates = self._aggregate_positions(stored_positions)
        native_prices, token_prices = self._load_prices(aggregates)

        computed: list[tuple[_Aggregate, Decimal | None, Decimal | None, Decimal | None]] = []
        tracked_value = Decimal(0)

        for aggregate in aggregates.values():
            quantity = self._quantity(
                raw_balance=aggregate.raw_balance,
                decimals=aggregate.decimals,
            )
            price = self._price_for(
                aggregate=aggregate,
                native_prices=native_prices,
                token_prices=token_prices,
            )
            value = quantity * price if quantity is not None and price is not None else None

            if value is not None:
                tracked_value += value

            computed.append((aggregate, quantity, price, value))

        positions = [
            self._to_position(
                aggregate=aggregate,
                quantity=quantity,
                price=price,
                value=value,
                tracked_value=tracked_value,
            )
            for aggregate, quantity, price, value in computed
        ]
        positions.sort(
            key=lambda item: (
                item.value_usd is None,
                -(item.value_usd or 0),
                item.symbol or item.name or item.asset_reference,
            ),
        )

        priced_count = sum(item.value_usd is not None for item in positions)
        unpriced_count = len(positions) - priced_count
        largest_weight = max(
            (
                item.weight
                for item in positions
                if item.weight is not None
            ),
            default=None,
        )
        last_synced_at = max(
            (
                wallet.last_synced_at
                for wallet in wallets
                if wallet.last_synced_at is not None
            ),
            default=None,
        )

        return ExposureReadModel(
            summary=ExposureSummary(
                tracked_value_usd=float(tracked_value),
                priced_position_count=priced_count,
                unpriced_position_count=unpriced_count,
                largest_position_weight=largest_weight,
                last_synced_at=last_synced_at,
            ),
            wallets=[
                ExposureWallet(
                    id=wallet.id,
                    address=wallet.address,
                    label=wallet.label,
                    network_ids=[ETHEREUM_MAINNET_NETWORK_ID],
                    sync_status=wallet.sync_status,
                    last_sync_attempt_at=wallet.last_sync_attempt_at,
                    last_synced_at=wallet.last_synced_at,
                    last_sync_error_code=wallet.last_sync_error_code,
                )
                for wallet in wallets
            ],
            positions=positions,
        )

    def _load_prices(
        self,
        aggregates: dict[tuple[str, str, str], _Aggregate],
    ) -> tuple[
        dict[str, Decimal | None],
        dict[tuple[str, str], Decimal],
    ]:
        by_network: dict[str, list[_Aggregate]] = {}
        for aggregate in aggregates.values():
            by_network.setdefault(aggregate.network_id, []).append(aggregate)

        native_prices: dict[str, Decimal | None] = {}
        token_prices: dict[tuple[str, str], Decimal] = {}

        for network_id, positions in by_network.items():
            if any(position.asset_kind == "native" for position in positions):
                native_prices[network_id] = (
                    self._price_provider.get_native_price_usd(
                        network_id=network_id,
                    )
                )

            contracts = [
                position.asset_reference
                for position in positions
                if position.asset_kind == "erc20"
            ]
            if contracts:
                quotes = self._price_provider.get_token_prices_usd(
                    network_id=network_id,
                    asset_references=contracts,
                )
                token_prices.update(
                    {
                        (network_id, contract): price
                        for contract, price in quotes.items()
                    }
                )

        return native_prices, token_prices

    @staticmethod
    def _aggregate_positions(
        positions: list[WalletPosition],
    ) -> dict[tuple[str, str, str], _Aggregate]:
        aggregates: dict[tuple[str, str, str], _Aggregate] = {}

        for position in positions:
            key = (
                position.network_id,
                position.asset_kind,
                position.asset_reference,
            )
            existing = aggregates.get(key)

            if existing is None:
                aggregates[key] = _Aggregate(
                    network_id=position.network_id,
                    asset_kind=position.asset_kind,
                    asset_reference=position.asset_reference,
                    name=position.name,
                    symbol=position.symbol,
                    decimals=position.decimals,
                    raw_balance=Decimal(position.raw_balance),
                )
                continue

            existing.raw_balance += Decimal(position.raw_balance)
            existing.name = existing.name or position.name
            existing.symbol = existing.symbol or position.symbol

            if (
                existing.decimals is not None
                and position.decimals is not None
                and existing.decimals != position.decimals
            ):
                existing.decimals = None
            elif existing.decimals is None:
                existing.decimals = position.decimals

        return aggregates

    @staticmethod
    def _price_for(
        *,
        aggregate: _Aggregate,
        native_prices: dict[str, Decimal | None],
        token_prices: dict[tuple[str, str], Decimal],
    ) -> Decimal | None:
        if aggregate.asset_kind == "native":
            return native_prices.get(aggregate.network_id)

        return token_prices.get(
            (aggregate.network_id, aggregate.asset_reference),
        )

    @staticmethod
    def _quantity(
        *,
        raw_balance: Decimal,
        decimals: int | None,
    ) -> Decimal | None:
        if decimals is None:
            return None

        return raw_balance / (Decimal(10) ** decimals)

    @classmethod
    def _to_position(
        cls,
        *,
        aggregate: _Aggregate,
        quantity: Decimal | None,
        price: Decimal | None,
        value: Decimal | None,
        tracked_value: Decimal,
    ) -> ExposurePosition:
        weight = None
        if value is not None and tracked_value > 0:
            weight = float((value / tracked_value) * Decimal(100))

        return ExposurePosition(
            network_id=aggregate.network_id,
            asset_kind=aggregate.asset_kind,
            asset_reference=aggregate.asset_reference,
            name=aggregate.name,
            symbol=aggregate.symbol,
            decimals=aggregate.decimals,
            quantity=cls._format_decimal(quantity) if quantity is not None else None,
            price_usd=float(price) if price is not None else None,
            value_usd=float(value) if value is not None else None,
            weight=weight,
            price_available=price is not None,
        )

    @staticmethod
    def _format_decimal(value: Decimal) -> str:
        formatted = format(value, "f")
        if "." not in formatted:
            return formatted

        stripped = formatted.rstrip("0").rstrip(".")
        return stripped or "0"
