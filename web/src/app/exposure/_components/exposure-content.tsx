"use client";

import {
  AlertTriangle,
  Clock3,
  Coins,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ExposurePosition,
  ExposureReadModel,
  ExposureWallet,
} from "@/types/exposure";
import type { TrackedWallet } from "@/types/wallet";
import { AddWalletDialog } from "./add-wallet-dialog";
import { fetchExposureSnapshot, getErrorDetail } from "../helpers";

type LoadState = "loading" | "ready" | "signed-out" | "error";

type PageNotice = {
  tone: "warning" | "error";
  message: string;
};

function formatCurrency(value: number | null, price = false) {
  if (value === null) {
    return "Unpriced";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: price && value < 1 ? 4 : 2,
    maximumFractionDigits:
      value < 0.01 ? 8 : price && value < 1 ? 6 : value < 100 ? 2 : 0,
  }).format(value);
}

function formatWeight(value: number | null) {
  return value === null ? "—" : `${value.toFixed(value < 1 ? 2 : 1)}%`;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Never";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function shortenAddress(address: string) {
  if (address.length <= 16) {
    return address;
  }

  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function networkLabel(networkId: string) {
  return networkId === "eip155:1" ? "Ethereum" : networkId;
}

function assetLabel(position: ExposurePosition) {
  return position.symbol ?? position.name ?? "Unknown asset";
}

function syncDescription(wallet: ExposureWallet) {
  if (wallet.syncStatus === "never") {
    return "Awaiting first sync";
  }

  if (wallet.syncStatus === "failed") {
    return wallet.lastSyncedAt
      ? `Refresh failed · snapshot from ${formatTimestamp(wallet.lastSyncedAt)}`
      : "Refresh failed · no successful snapshot yet";
  }

  return `Synced ${formatTimestamp(wallet.lastSyncedAt)}`;
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="calyrn-panel rounded-2xl px-4 py-4">
      <div className="data-label">{label}</div>
      <div className="number-display mt-2 font-heading text-2xl font-medium">
        {value}
      </div>
      <div className="mt-1 text-[10px] leading-4 text-muted-foreground">
        {helper}
      </div>
    </div>
  );
}

function SignedOutExposure() {
  return (
    <section className="calyrn-panel calyrn-edge rounded-3xl px-6 py-14 text-center sm:px-10">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[var(--calyrn-ice)]">
        <WalletCards className="size-5" />
      </div>
      <h2 className="mt-5 font-heading text-2xl font-medium tracking-[-0.04em]">
        Your exposure view is private
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Sign in to track wallet addresses and keep their association with your
        Calyrn account private.
      </p>
      <a
        href="/auth/login"
        className="mt-6 inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.07]"
      >
        <LogIn className="size-3.5" />
        Sign in
      </a>
    </section>
  );
}

function EmptyExposure({
  onCreated,
}: {
  onCreated: (wallet: TrackedWallet) => Promise<void>;
}) {
  return (
    <section className="calyrn-panel calyrn-edge rounded-3xl px-6 py-14 text-center sm:px-10">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[var(--calyrn-jade)]">
        <WalletCards className="size-5" />
      </div>
      <h2 className="mt-5 font-heading text-2xl font-medium tracking-[-0.04em]">
        Track your first wallet
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        Add a public Ethereum address to build a read-only view of current
        on-chain exposure. No connection, signing, or custody is involved.
      </p>
      <div className="mt-6 flex justify-center">
        <AddWalletDialog onCreated={onCreated} />
      </div>
      <div className="mx-auto mt-5 flex max-w-lg items-start justify-center gap-2 text-[10px] leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--calyrn-ice)]" />
        <span>
          Calyrn only reads public balances. Tracking an address does not prove
          ownership.
        </span>
      </div>
    </section>
  );
}

function NoPositionsState() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-muted-foreground">
        <Coins className="size-4" />
      </div>
      <h3 className="mt-4 font-heading text-lg font-medium tracking-[-0.03em]">
        No supported balances found
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
        The tracked wallets currently have no non-zero native ETH or ERC-20
        positions in the supported Ethereum Mainnet snapshot.
      </p>
    </div>
  );
}

function PositionTable({ positions }: { positions: ExposurePosition[] }) {
  if (positions.length === 0) {
    return <NoPositionsState />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-white/[0.06] bg-black/[0.08] font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
            <th className="px-5 py-3 text-left font-medium">Asset</th>
            <th className="px-4 py-3 text-right font-medium">Quantity</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-right font-medium">Value</th>
            <th className="px-4 py-3 text-right font-medium">Weight</th>
            <th className="px-5 py-3 text-left font-medium">Network</th>
          </tr>
        </thead>

        <tbody>
          {positions.map((position) => {
            const label = assetLabel(position);
            const identity =
              position.assetKind === "native"
                ? "Native"
                : shortenAddress(position.assetReference);

            return (
              <tr
                key={`${position.networkId}:${position.assetKind}:${position.assetReference}`}
                className="border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.025]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] font-mono text-[9px] font-semibold uppercase text-foreground/80">
                      {label.slice(0, 2)}
                    </span>
                    <div>
                      <div className="font-medium text-foreground/95">
                        {label}
                      </div>
                      <div
                        className="mt-0.5 max-w-52 truncate font-mono text-[8px] uppercase tracking-[0.07em] text-muted-foreground"
                        title={position.assetReference}
                      >
                        {position.name && position.symbol
                          ? position.name
                          : identity}
                      </div>
                    </div>
                  </div>
                </td>
                <td
                  className="number-display max-w-[180px] truncate px-4 py-4 text-right font-mono text-[10px]"
                  title={position.quantity ?? undefined}
                >
                  {position.quantity ?? "Unavailable"}
                </td>
                <td className="number-display px-4 py-4 text-right">
                  <span
                    className={
                      position.priceAvailable
                        ? "text-foreground"
                        : "text-[var(--calyrn-amber)]"
                    }
                  >
                    {formatCurrency(position.priceUsd, true)}
                  </span>
                </td>
                <td className="number-display px-4 py-4 text-right font-medium">
                  {formatCurrency(position.valueUsd)}
                </td>
                <td className="number-display px-4 py-4 text-right">
                  {formatWeight(position.weight)}
                </td>
                <td className="px-5 py-4 text-left">
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                    {networkLabel(position.networkId)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ExposureContent() {
  const [state, setState] = useState<LoadState>("loading");
  const [exposure, setExposure] = useState<ExposureReadModel | null>(null);
  const [notice, setNotice] = useState<PageNotice | null>(null);
  const [pendingWallets, setPendingWallets] = useState<Set<string>>(new Set());
  const [walletToRemove, setWalletToRemove] = useState<ExposureWallet | null>(
    null,
  );

  const loadExposure = useCallback(async () => {
    const result = await fetchExposureSnapshot();

    if (result.status === "signed-out") {
      setExposure(null);
      setState("signed-out");
      return false;
    }

    if (result.status === "error") {
      setState("error");
      setNotice({
        tone: "error",
        message: result.message,
      });
      return false;
    }

    setExposure(result.exposure);
    setState("ready");
    return true;
  }, []);

  useEffect(() => {
    void loadExposure();
  }, [loadExposure]);

  const failedWalletCount = useMemo(
    () =>
      exposure?.wallets.filter((wallet) => wallet.syncStatus === "failed")
        .length ?? 0,
    [exposure],
  );

  async function refreshWallet(walletId: string, initial = false) {
    setPendingWallets((current) => new Set(current).add(walletId));
    setNotice(null);

    try {
      const response = await fetch(
        `/api/me/wallets/${encodeURIComponent(walletId)}/refresh`,
        { method: "POST" },
      );

      if (response.status === 401) {
        setState("signed-out");
        return false;
      }

      if (!response.ok) {
        const detail = await getErrorDetail(response);
        setNotice({
          tone: "warning",
          message: initial
            ? "Wallet added, but its first sync failed. You can retry from Tracked wallets."
            : (detail ??
              "The refresh failed. Calyrn is keeping the previous successful snapshot."),
        });
        await loadExposure();
        return false;
      }

      await loadExposure();
      toast.success(initial ? "Wallet tracked" : "Wallet refreshed");
      return true;
    } catch {
      setNotice({
        tone: "warning",
        message: initial
          ? "Wallet added, but Calyrn could not start its first sync."
          : "The refresh request failed. Your previous snapshot is unchanged.",
      });
      await loadExposure();
      return false;
    } finally {
      setPendingWallets((current) => {
        const next = new Set(current);
        next.delete(walletId);
        return next;
      });
    }
  }

  async function handleCreated(wallet: TrackedWallet) {
    await refreshWallet(wallet.id, true);
  }

  async function removeWallet(walletId: string) {
    setPendingWallets((current) => new Set(current).add(walletId));
    setNotice(null);

    try {
      const response = await fetch(
        `/api/me/wallets/${encodeURIComponent(walletId)}`,
        { method: "DELETE" },
      );

      if (response.status === 401) {
        setState("signed-out");
        return;
      }

      if (!response.ok) {
        setNotice({
          tone: "error",
          message:
            (await getErrorDetail(response)) ??
            "Calyrn could not remove this tracked wallet.",
        });
        return;
      }

      setWalletToRemove(null);
      await loadExposure();
      toast.success("Wallet removed from Exposure");
    } catch {
      setNotice({
        tone: "error",
        message: "The remove request did not reach Calyrn. Please try again.",
      });
    } finally {
      setPendingWallets((current) => {
        const next = new Set(current);
        next.delete(walletId);
        return next;
      });
    }
  }

  if (state === "loading") {
    return (
      <section className="calyrn-panel rounded-3xl px-6 py-14 text-center">
        <RefreshCw className="mx-auto size-4 animate-spin text-[var(--calyrn-jade)]" />
        <div className="mt-3 text-sm text-muted-foreground">
          Loading tracked exposure…
        </div>
      </section>
    );
  }

  if (state === "signed-out") {
    return <SignedOutExposure />;
  }

  if (state === "error" && !exposure) {
    return (
      <section className="calyrn-panel calyrn-edge rounded-3xl px-6 py-14 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-[var(--calyrn-vermilion)]/20 bg-[var(--calyrn-vermilion)]/7 text-[var(--calyrn-vermilion)]">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="mt-5 font-heading text-2xl font-medium tracking-[-0.04em]">
          Exposure is temporarily unavailable
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {notice?.message ??
            "Calyrn could not assemble the current exposure view."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            setState("loading");
            setNotice(null);
            void loadExposure();
          }}
          className="mt-6 rounded-xl"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </section>
    );
  }

  if (!exposure) {
    return null;
  }

  if (exposure.wallets.length === 0) {
    return <EmptyExposure onCreated={handleCreated} />;
  }

  const totalAssets =
    exposure.summary.pricedPositionCount +
    exposure.summary.unpricedPositionCount;

  return (
    <>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <div className="data-label">Current snapshot</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Valuation uses current public market quotes against the latest
            successfully synced on-chain balances.
          </p>
        </div>
        <AddWalletDialog onCreated={handleCreated} />
      </section>

      {notice && (
        <section
          role="status"
          className={
            notice.tone === "error"
              ? "mt-4 flex items-start gap-3 rounded-2xl border border-[var(--calyrn-vermilion)]/20 bg-[var(--calyrn-vermilion)]/6 px-4 py-3"
              : "mt-4 flex items-start gap-3 rounded-2xl border border-[var(--calyrn-amber)]/20 bg-[var(--calyrn-amber)]/6 px-4 py-3"
          }
        >
          <AlertTriangle
            className={
              notice.tone === "error"
                ? "mt-0.5 size-4 shrink-0 text-[var(--calyrn-vermilion)]"
                : "mt-0.5 size-4 shrink-0 text-[var(--calyrn-amber)]"
            }
          />
          <div>
            <div className="text-xs font-medium">
              {notice.tone === "error"
                ? "Exposure action failed"
                : "Snapshot needs attention"}
            </div>
            <div className="mt-1 text-[10px] leading-5 text-muted-foreground">
              {notice.message}
            </div>
          </div>
        </section>
      )}

      {failedWalletCount > 0 && !notice && (
        <section className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--calyrn-amber)]/20 bg-[var(--calyrn-amber)]/6 px-4 py-3">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-[var(--calyrn-amber)]" />
          <div>
            <div className="text-xs font-medium">
              {failedWalletCount === 1
                ? "One wallet needs a refresh"
                : `${failedWalletCount} wallets need a refresh`}
            </div>
            <div className="mt-1 text-[10px] leading-5 text-muted-foreground">
              Calyrn is preserving the latest successful snapshot instead of
              replacing it with incomplete provider data.
            </div>
          </div>
        </section>
      )}

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Tracked value"
          value={formatCurrency(exposure.summary.trackedValueUsd)}
          helper="Priced positions only"
        />
        <SummaryCard
          label="Largest position"
          value={formatWeight(exposure.summary.largestPositionWeight)}
          helper="Share of priced tracked value"
        />
        <SummaryCard
          label="Tracked assets"
          value={String(totalAssets)}
          helper={
            exposure.summary.unpricedPositionCount > 0
              ? `${exposure.summary.unpricedPositionCount} currently unpriced`
              : "All current positions priced"
          }
        />
        <SummaryCard
          label="Last synced"
          value={formatTimestamp(exposure.summary.lastSyncedAt)}
          helper={`${exposure.wallets.length} tracked ${
            exposure.wallets.length === 1 ? "wallet" : "wallets"
          }`}
        />
      </section>

      <section className="calyrn-panel calyrn-edge mt-5 overflow-hidden rounded-3xl">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <div className="data-label">Concentration</div>
            <h2 className="mt-1 font-heading text-lg font-medium tracking-[-0.03em]">
              Current asset exposure
            </h2>
          </div>
          {exposure.summary.unpricedPositionCount > 0 && (
            <div className="max-w-sm text-[10px] leading-4 text-[var(--calyrn-amber)]">
              {exposure.summary.unpricedPositionCount}{" "}
              {exposure.summary.unpricedPositionCount === 1
                ? "asset has"
                : "assets have"}{" "}
              no current CoinGecko quote and are excluded from tracked value and
              weights.
            </div>
          )}
        </div>

        <PositionTable positions={exposure.positions} />
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-4 px-1">
          <div>
            <div className="data-label">Private tracking state</div>
            <h2 className="mt-1 font-heading text-lg font-medium tracking-[-0.03em]">
              Tracked wallets
            </h2>
          </div>
          <div className="hidden font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground sm:block">
            Ethereum Mainnet only
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {exposure.wallets.map((wallet) => {
            const pending = pendingWallets.has(wallet.id);

            return (
              <article
                key={wallet.id}
                className="calyrn-panel calyrn-edge rounded-2xl px-4 py-4 sm:px-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-medium">
                        {wallet.label ?? "Tracked wallet"}
                      </h3>
                      <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                        Ethereum
                      </span>
                    </div>
                    <div
                      className="mt-1.5 truncate font-mono text-[9px] text-muted-foreground"
                      title={wallet.address}
                    >
                      {shortenAddress(wallet.address)}
                    </div>
                  </div>

                  <span
                    className={
                      wallet.syncStatus === "success"
                        ? "rounded-full border border-[var(--calyrn-jade)]/18 bg-[var(--calyrn-jade)]/7 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--calyrn-jade)]"
                        : wallet.syncStatus === "failed"
                          ? "rounded-full border border-[var(--calyrn-amber)]/20 bg-[var(--calyrn-amber)]/7 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--calyrn-amber)]"
                          : "rounded-full border border-white/[0.08] bg-white/[0.025] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground"
                    }
                  >
                    {wallet.syncStatus}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.05] pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[10px] leading-4 text-muted-foreground">
                    {syncDescription(wallet)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => void refreshWallet(wallet.id)}
                      className="rounded-lg"
                    >
                      <RefreshCw
                        className={pending ? "size-3 animate-spin" : "size-3"}
                      />
                      Refresh
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => setWalletToRemove(wallet)}
                      className="rounded-lg text-muted-foreground hover:text-[var(--calyrn-vermilion)]"
                    >
                      <Trash2 className="size-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-5 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.018] px-4 py-3 text-[10px] leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--calyrn-ice)]" />
        <span>
          Read-only tracking. Calyrn does not connect to these wallets and will
          never request a seed phrase, private key, transaction approval, or
          wallet signature.
        </span>
      </section>

      <Dialog
        open={walletToRemove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setWalletToRemove(null);
          }
        }}
      >
        <DialogContent className="calyrn-panel border-white/[0.08] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove tracked wallet?</DialogTitle>
            <DialogDescription>
              This removes the address and its current Calyrn snapshot. It does
              not affect anything on-chain.
            </DialogDescription>
          </DialogHeader>

          {walletToRemove && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] font-medium">
                {walletToRemove.label ?? "Tracked wallet"}
              </div>
              <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                {shortenAddress(walletToRemove.address)}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setWalletToRemove(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                walletToRemove ? pendingWallets.has(walletToRemove.id) : false
              }
              onClick={() => {
                if (walletToRemove) {
                  void removeWallet(walletToRemove.id);
                }
              }}
            >
              <Trash2 className="size-3.5" />
              Remove wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
