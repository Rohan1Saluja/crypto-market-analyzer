import { ApiError, apiGet } from "@/lib/api-client";
import type {
  CoinDetail,
  CoinNewsItem,
  CoinResearch,
  OhlcPoint,
  PriceHistoryRange,
  PricePoint,
  TechnicalSnapshot,
} from "@/types/coin";

function coinPath(id: string) {
  return `/api/v1/coins/${encodeURIComponent(id)}`;
}

export const coinService = {
  async getDetail(id: string): Promise<CoinDetail | null> {
    try {
      return await apiGet<CoinDetail>(coinPath(id));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async getPriceHistory(
    id: string,
    range: PriceHistoryRange,
  ): Promise<PricePoint[] | null> {
    try {
      return await apiGet<PricePoint[]>(
        `${coinPath(id)}/price-history?range=${range}`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async getOhlcHistory(
    id: string,
    range: PriceHistoryRange,
  ): Promise<OhlcPoint[] | null> {
    try {
      return await apiGet<OhlcPoint[]>(
        `${coinPath(id)}/ohlc?range=${range}`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async getTechnicals(id: string): Promise<TechnicalSnapshot | null> {
    try {
      return await apiGet<TechnicalSnapshot>(
        `${coinPath(id)}/technicals`,
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 422)
      ) {
        return null;
      }

      throw error;
    }
  },

  async getResearch(id: string): Promise<CoinResearch | null> {
    try {
      return await apiGet<CoinResearch>(`${coinPath(id)}/research`);
    } catch (error) {
      if (
        error instanceof ApiError &&
        [404, 429, 502, 503].includes(error.status)
      ) {
        return null;
      }

      throw error;
    }
  },

  async getNews(id: string): Promise<CoinNewsItem[]> {
    try {
      return await apiGet<CoinNewsItem[]>(`${coinPath(id)}/news`);
    } catch (error) {
      if (error instanceof ApiError) {
        return [];
      }

      throw error;
    }
  },
};
