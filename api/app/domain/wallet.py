EVM_ADDRESS_FAMILY = "evm"
ETHEREUM_MAINNET_NETWORK_ID = "eip155:1"

_EVM_ADDRESS_HEX_LENGTH = 40


class InvalidWalletAddressError(ValueError):
    pass


def normalize_evm_address(value: str) -> str:
    candidate = value.strip()

    if not candidate.startswith("0x"):
        raise InvalidWalletAddressError("EVM address must start with 0x")

    payload = candidate[2:]
    if len(payload) != _EVM_ADDRESS_HEX_LENGTH:
        raise InvalidWalletAddressError("EVM address must contain exactly 20 bytes")

    try:
        raw_address = bytes.fromhex(payload)
    except ValueError as exc:
        raise InvalidWalletAddressError("EVM address must be hexadecimal") from exc

    if len(raw_address) != 20:
        raise InvalidWalletAddressError("EVM address must contain exactly 20 bytes")

    return f"0x{payload.lower()}"
