import type { WalletSyncStatus } from "@/types/wallet";

export type ExposureSummary = {
  trackedValueUsd: number;
  pricedPositionCount: number;
  unpricedPositionCount: number;
  largestPositionWeight: number | null;
  lastSyncedAt: string | null;
};

export type ExposureWallet = {
  id: string;
  address: string;
  label: string | null;
  networkIds: string[];
  syncStatus: WalletSyncStatus;
  lastSyncAttemptAt: string | null;
  lastSyncedAt: string | null;
  lastSyncErrorCode: string | null;
};

export type ExposurePosition = {
  networkId: string;
  assetKind: "native" | "erc20";
  assetReference: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  quantity: string | null;
  priceUsd: number | null;
  valueUsd: number | null;
  weight: number | null;
  priceAvailable: boolean;
};

export type ExposureReadModel = {
  summary: ExposureSummary;
  wallets: ExposureWallet[];
  positions: ExposurePosition[];
};
