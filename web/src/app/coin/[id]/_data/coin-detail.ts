import { marketCoins } from "@/data/market";
import type { MarketCoin } from "@/types/market";

export type CoinPricePoint = {
  label: string;
  price: number;
};

export type CoinMetric = {
  label: string;
  value: string;
  helper: string;
};

export type CoinTechnicalSnapshot = {
  momentum: "Bullish" | "Neutral" | "Bearish";
  rsi: number;
  macd: "Bullish" | "Bearish";
  support: number;
  resistance: number;
  volatility: "Low" | "Moderate" | "High";
};

export type CoinDetail = {
  coin: MarketCoin;
  description: string;
  priceHistory: CoinPricePoint[];
  metrics: CoinMetric[];
  technicals: CoinTechnicalSnapshot;
};

const descriptions: Record<string, string> = {
  bitcoin:
    "Bitcoin is the largest crypto asset by market capitalization and the primary benchmark for broader digital-asset market direction.",
  ethereum:
    "Ethereum is a programmable blockchain network used for decentralized applications, token issuance, and on-chain financial activity.",
  tether:
    "Tether is a USD-pegged stablecoin designed to track the value of the US dollar and provide dollar liquidity across crypto markets.",
  bnb:
    "BNB is the native asset of the BNB Chain ecosystem and is used across network fees, applications, and exchange-related utility.",
  solana:
    "Solana is a high-throughput blockchain focused on low-cost applications, trading, consumer crypto products, and on-chain markets.",
  "usd-coin":
    "USDC is a USD-pegged stablecoin used for payments, trading, settlement, and dollar-denominated activity across blockchain networks.",
  xrp:
    "XRP is the native asset of the XRP Ledger, a blockchain network focused on fast settlement and value transfer.",
  dogecoin:
    "Dogecoin is a proof-of-work crypto asset that began as a meme currency and developed a large retail and payments-oriented community.",
};

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatChange(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function buildPriceHistory(coin: MarketCoin): CoinPricePoint[] {
  const labels = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Now",
  ];

  const min = Math.min(...coin.sparkline);
  const max = Math.max(...coin.sparkline);
  const range = max - min || 1;
  const amplitude = Math.max(
    0.01,
    Math.min(0.08, Math.abs(coin.change7d) / 100 + 0.018),
  );

  const generated = coin.sparkline.map((value) => {
    const normalized = (value - min) / range - 0.5;
    return coin.price * (1 + normalized * amplitude);
  });

  const adjustment = coin.price - generated[generated.length - 1];

  return generated.map((price, index) => ({
    label: labels[index] ?? `${index + 1}`,
    price: Math.max(0, price + adjustment),
  }));
}

function buildTechnicals(coin: MarketCoin): CoinTechnicalSnapshot {
  const rsi = Math.max(25, Math.min(75, 50 + coin.change7d * 2.2));
  const absoluteMove = Math.abs(coin.change24h) + Math.abs(coin.change7d) / 3;

  return {
    momentum:
      coin.change7d > 3 ? "Bullish" : coin.change7d < -3 ? "Bearish" : "Neutral",
    rsi: Number(rsi.toFixed(1)),
    macd: coin.change24h >= 0 ? "Bullish" : "Bearish",
    support: coin.price * (1 - Math.max(0.025, absoluteMove / 100)),
    resistance: coin.price * (1 + Math.max(0.025, absoluteMove / 100)),
    volatility:
      absoluteMove > 7 ? "High" : absoluteMove > 3 ? "Moderate" : "Low",
  };
}

export function getCoinDetail(id: string): CoinDetail | null {
  const coin = marketCoins.find((item) => item.id === id);

  if (!coin) {
    return null;
  }

  return {
    coin,
    description:
      descriptions[coin.id] ??
      `${coin.name} is a tracked crypto asset in the Crypto Market Analyzer demo universe.`,
    priceHistory: buildPriceHistory(coin),
    metrics: [
      {
        label: "Market rank",
        value: `#${coin.rank}`,
        helper: "By market capitalization",
      },
      {
        label: "Market cap",
        value: formatCompactCurrency(coin.marketCap),
        helper: "Current network valuation",
      },
      {
        label: "24h volume",
        value: formatCompactCurrency(coin.volume24h),
        helper: "Trading activity",
      },
      {
        label: "7d performance",
        value: formatChange(coin.change7d),
        helper: "Seven-day price change",
      },
    ],
    technicals: buildTechnicals(coin),
  };
}
