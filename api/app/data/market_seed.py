MARKET_STATS = [
    {
        "label": "Global market cap",
        "value": "$2.42T",
        "helper": "Across tracked assets",
        "change": 2.14,
    },
    {
        "label": "24h volume",
        "value": "$91.8B",
        "helper": "Spot + derivatives",
        "change": 8.62,
    },
    {
        "label": "BTC dominance",
        "value": "54.7%",
        "helper": "Share of total market cap",
        "change": -0.34,
    },
    {
        "label": "Tracked assets",
        "value": "13,428",
        "helper": "Coins and tokens indexed",
    },
]

MARKET_COINS = [
    {
        "id": "bitcoin",
        "name": "Bitcoin",
        "symbol": "BTC",
        "rank": 1,
        "price": 67183.42,
        "change_1h": 0.12,
        "change_24h": 2.48,
        "change_7d": 5.16,
        "market_cap": 1_328_000_000_000,
        "volume_24h": 38_200_000_000,
        "sparkline": [28, 30, 29, 33, 35, 34, 38, 37, 40, 43, 42, 46],
    },
    {
        "id": "ethereum",
        "name": "Ethereum",
        "symbol": "ETH",
        "rank": 2,
        "price": 3512.91,
        "change_1h": -0.18,
        "change_24h": 1.74,
        "change_7d": 3.88,
        "market_cap": 422_100_000_000,
        "volume_24h": 17_600_000_000,
        "sparkline": [39, 37, 38, 36, 34, 37, 40, 39, 42, 44, 43, 45],
    },
    {
        "id": "tether",
        "name": "Tether",
        "symbol": "USDT",
        "rank": 3,
        "price": 1.0,
        "change_1h": 0.0,
        "change_24h": 0.01,
        "change_7d": -0.02,
        "market_cap": 112_500_000_000,
        "volume_24h": 52_900_000_000,
        "sparkline": [30, 30, 30, 31, 30, 30, 29, 30, 30, 30, 31, 30],
    },
    {
        "id": "bnb",
        "name": "BNB",
        "symbol": "BNB",
        "rank": 4,
        "price": 593.62,
        "change_1h": 0.31,
        "change_24h": 3.04,
        "change_7d": 6.22,
        "market_cap": 91_200_000_000,
        "volume_24h": 2_100_000_000,
        "sparkline": [26, 25, 29, 31, 30, 34, 36, 35, 39, 41, 43, 46],
    },
    {
        "id": "solana",
        "name": "Solana",
        "symbol": "SOL",
        "rank": 5,
        "price": 151.77,
        "change_1h": 0.64,
        "change_24h": 4.91,
        "change_7d": 9.73,
        "market_cap": 70_300_000_000,
        "volume_24h": 3_900_000_000,
        "sparkline": [24, 27, 26, 31, 34, 33, 37, 40, 38, 44, 46, 49],
    },
    {
        "id": "usd-coin",
        "name": "USDC",
        "symbol": "USDC",
        "rank": 6,
        "price": 1.0,
        "change_1h": 0.0,
        "change_24h": -0.01,
        "change_7d": 0.02,
        "market_cap": 32_400_000_000,
        "volume_24h": 6_100_000_000,
        "sparkline": [30, 31, 30, 30, 29, 30, 30, 31, 30, 30, 30, 30],
    },
    {
        "id": "xrp",
        "name": "XRP",
        "symbol": "XRP",
        "rank": 7,
        "price": 0.5338,
        "change_1h": -0.22,
        "change_24h": -1.34,
        "change_7d": 2.17,
        "market_cap": 29_700_000_000,
        "volume_24h": 1_400_000_000,
        "sparkline": [42, 40, 39, 41, 38, 36, 37, 35, 36, 34, 33, 35],
    },
    {
        "id": "dogecoin",
        "name": "Dogecoin",
        "symbol": "DOGE",
        "rank": 8,
        "price": 0.1392,
        "change_1h": 0.41,
        "change_24h": 2.09,
        "change_7d": -1.62,
        "market_cap": 20_100_000_000,
        "volume_24h": 1_100_000_000,
        "sparkline": [34, 36, 33, 31, 32, 35, 37, 36, 38, 37, 39, 40],
    },
]

COIN_DESCRIPTIONS = {
    "bitcoin": (
        "Bitcoin is the largest crypto asset by market capitalization and the primary "
        "benchmark for broader digital-asset market direction."
    ),
    "ethereum": (
        "Ethereum is a programmable blockchain network used for decentralized applications, "
        "token issuance, and on-chain financial activity."
    ),
    "tether": (
        "Tether is a USD-pegged stablecoin designed to track the value of the US dollar and "
        "provide dollar liquidity across crypto markets."
    ),
    "bnb": (
        "BNB is the native asset of the BNB Chain ecosystem and is used across network fees, "
        "applications, and exchange-related utility."
    ),
    "solana": (
        "Solana is a high-throughput blockchain focused on low-cost applications, trading, "
        "consumer crypto products, and on-chain markets."
    ),
    "usd-coin": (
        "USDC is a USD-pegged stablecoin used for payments, trading, settlement, and "
        "dollar-denominated activity across blockchain networks."
    ),
    "xrp": (
        "XRP is the native asset of the XRP Ledger, a blockchain network focused on fast "
        "settlement and value transfer."
    ),
    "dogecoin": (
        "Dogecoin is a proof-of-work crypto asset that began as a meme currency and developed "
        "a large retail and payments-oriented community."
    ),
}
