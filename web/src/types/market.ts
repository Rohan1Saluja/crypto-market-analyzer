export type MarketCoin = {
  id: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  rank: number | null;
  price: number | null;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  marketCap: number | null;
  volume24h: number | null;
  sparkline: number[];
};

export type MarketStat = {
  label: string;
  value: string;
  helper: string;
  change: number | null;
};
