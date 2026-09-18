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

export type CoinFundamentals = {
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  fullyDilutedValuation: number | null;
  allTimeHigh: number | null;
  allTimeHighChangePercentage: number | null;
  allTimeHighDate: string | null;
  allTimeLow: number | null;
  allTimeLowChangePercentage: number | null;
  allTimeLowDate: string | null;
  genesisDate: string | null;
  hashingAlgorithm: string | null;
  categories: string[];
  homepageUrl: string | null;
  blockchainExplorerUrl: string | null;
};

export type CoinSentiment = {
  votesUpPercentage: number | null;
  votesDownPercentage: number | null;
  watchlistUsers: number | null;
  redditSubscribers: number | null;
  githubStars: number | null;
  githubForks: number | null;
  githubCommits4Weeks: number | null;
};

export type CoinResearch = {
  fundamentals: CoinFundamentals;
  sentiment: CoinSentiment;
};

export type CoinNewsItem = {
  title: string;
  source: string;
  url: string;
  publishedAt: string | null;
};

export type PriceHistoryRange = "24h" | "7d" | "30d";
