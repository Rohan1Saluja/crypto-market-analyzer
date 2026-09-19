import pytest

from app.domain.wallet import InvalidWalletAddressError, normalize_evm_address


def test_normalize_evm_address_returns_canonical_lowercase() -> None:
    assert normalize_evm_address(
        "  0xAbCdEf0123456789aBCdef0123456789ABCdEf01  "
    ) == "0xabcdef0123456789abcdef0123456789abcdef01"


@pytest.mark.parametrize(
    "value",
    [
        "",
        "abcdef0123456789abcdef0123456789abcdef01",
        "0x1234",
        "0xabcdef0123456789abcdef0123456789abcdef0z",
    ],
)
def test_normalize_evm_address_rejects_invalid_values(value: str) -> None:
    with pytest.raises(InvalidWalletAddressError):
        normalize_evm_address(value)
