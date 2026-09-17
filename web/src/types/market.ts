export type MarketCoin = {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  sparkline: number[];
};

export type MarketStat = {
  label: string;
  value: string;
  helper: string;
  change?: number;
};
