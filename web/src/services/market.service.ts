import { apiGet } from "@/lib/api-client";
import type { MarketCoin, MarketStat } from "@/types/market";

export const marketService = {
  getOverview() {
    return apiGet<MarketStat[]>("/api/v1/markets/overview");
  },

  getMarkets() {
    return apiGet<MarketCoin[]>("/api/v1/markets");
  },
};
