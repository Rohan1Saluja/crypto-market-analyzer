import type { MarketCoin } from "@/types/market";

export type CoinMetric = {
  label: string;
  value: string;
  helper: string;
};

export type CoinDetail = {
  coin: MarketCoin;
  description: string | null;
  metrics: CoinMetric[];
};

export type PricePoint = {
  timestamp: number;
  price: number;
  marketCap: number | null;
  volume24h: number | null;
};

export type TechnicalSnapshot = {
  momentum: "Bullish" | "Neutral" | "Bearish";
  rsi: number;
  macd: "Bullish" | "Bearish";
  support: number;
  resistance: number;
  volatility: "Low" | "Moderate" | "High";
  volatilityAnnualized: number;
  timeframe: "1h";
};

export type PriceHistoryRange = "24h" | "7d" | "30d";
