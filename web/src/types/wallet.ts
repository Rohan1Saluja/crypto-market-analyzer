export type WalletSyncStatus = "never" | "success" | "failed";

export type TrackedWallet = {
  id: string;
  addressFamily: string;
  address: string;
  label: string | null;
  syncStatus: WalletSyncStatus;
  lastSyncAttemptAt: string | null;
  lastSyncedAt: string | null;
  lastSyncErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTrackedWalletInput = {
  address: string;
  label?: string | null;
};

export type WalletRefreshResult = {
  wallet: TrackedWallet;
  positionCount: number;
};
