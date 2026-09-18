"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  LogIn,
  Search,
} from "lucide-react";
import { useMemo } from "react";

import { WatchlistStar } from "@/components/watchlist/watchlist-star";
import { useWatchlist } from "@/components/watchlist/watchlist-provider";
import type { MarketCoin } from "@/types/market";

function formatCurrency(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value < 100 ? 2 : 0,
  }).format(value);
}

function Change({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const positive = value >= 0;

  return (
    <span
      className={
        positive
          ? "signal-positive inline-flex items-center gap-0.5 font-mono text-[10px] font-medium tabular-nums"
          : "signal-negative inline-flex items-center gap-0.5 font-mono text-[10px] font-medium tabular-nums"
      }
    >
      {positive ? (
        <ArrowUpRight className="size-3" />
      ) : (
        <ArrowDownRight className="size-3" />
      )}
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

function EmptyWatch() {
  return (
    <section className="calyrn-panel calyrn-edge rounded-3xl px-6 py-14 text-center sm:px-10">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[var(--calyrn-amber)]">
        <Bookmark className="size-5" />
      </div>
      <h2 className="mt-5 font-heading text-2xl font-medium tracking-[-0.04em]">
        Nothing in Watch yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Save assets from Markets or Research to keep the names you care about
        in one personal view.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.07]"
      >
        <Search className="size-3.5" />
        Explore markets
      </Link>
    </section>
  );
}

function SignedOutWatch() {
  return (
    <section className="calyrn-panel calyrn-edge rounded-3xl px-6 py-14 text-center sm:px-10">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[var(--calyrn-ice)]">
        <Bookmark className="size-5" />
      </div>
      <h2 className="mt-5 font-heading text-2xl font-medium tracking-[-0.04em]">
        Your Watch is private
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Sign in to see the assets saved to your Calyrn account.
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

export function WatchContent({ coins }: { coins: MarketCoin[] }) {
  const { items, status } = useWatchlist();

  const coinById = useMemo(
    () => new Map(coins.map((coin) => [coin.id, coin])),
    [coins],
  );

  const rows = useMemo(
    () =>
      items.map((item) => ({
        item,
        coin: coinById.get(item.assetId) ?? null,
      })),
    [coinById, items],
  );

  const pricedRows = rows.filter((row) => row.coin !== null);
  const gainers = pricedRows.filter(
    ({ coin }) => coin !== null && (coin.change24h ?? 0) > 0,
  ).length;
  const decliners = pricedRows.filter(
    ({ coin }) => coin !== null && (coin.change24h ?? 0) < 0,
  ).length;

  if (status === "loading") {
    return (
      <section className="calyrn-panel rounded-3xl px-6 py-14 text-center text-sm text-muted-foreground">
        Loading your Watch…
      </section>
    );
  }

  if (status === "signed-out") {
    return <SignedOutWatch />;
  }

  if (rows.length === 0) {
    return <EmptyWatch />;
  }

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="calyrn-panel rounded-2xl px-4 py-4">
          <div className="data-label">Tracked assets</div>
          <div className="number-display mt-2 font-heading text-2xl font-medium">
            {rows.length}
          </div>
        </div>
        <div className="calyrn-panel rounded-2xl px-4 py-4">
          <div className="data-label">24h gainers</div>
          <div className="number-display signal-positive mt-2 font-heading text-2xl font-medium">
            {gainers}
          </div>
        </div>
        <div className="calyrn-panel rounded-2xl px-4 py-4">
          <div className="data-label">24h decliners</div>
          <div className="number-display signal-negative mt-2 font-heading text-2xl font-medium">
            {decliners}
          </div>
        </div>
      </section>

      <section className="calyrn-panel calyrn-edge mt-5 overflow-hidden rounded-3xl">
        <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
          <div className="data-label">Personal context</div>
          <h2 className="mt-1 font-heading text-lg font-medium tracking-[-0.03em]">
            Assets you are watching
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-black/[0.08] font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-5 py-3 text-left font-medium">Asset</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">24h</th>
                <th className="px-4 py-3 text-right font-medium">7d</th>
                <th className="px-4 py-3 text-left font-medium">Thesis</th>
                <th className="w-16 px-5 py-3 text-center font-medium">
                  Watch
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map(({ item, coin }) => {
                const name = coin?.name ?? item.assetId;
                const symbol = coin?.symbol ?? "saved";
                const imageUrl = coin?.imageUrl ?? null;

                return (
                  <tr
                    key={item.id}
                    className="group/row border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/coin/${item.assetId}`}
                        className="flex w-fit items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt=""
                            width={34}
                            height={34}
                            className="size-[34px] rounded-full"
                          />
                        ) : (
                          <span className="flex size-[34px] items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] font-mono text-[9px] font-semibold uppercase text-foreground/80">
                            {symbol.slice(0, 2)}
                          </span>
                        )}
                        <div>
                          <div className="font-medium text-foreground/95">
                            {name}
                          </div>
                          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                            {symbol}
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="number-display px-4 py-4 text-right font-medium">
                      {formatCurrency(coin?.price ?? null)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Change value={coin?.change24h ?? null} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Change value={coin?.change7d ?? null} />
                    </td>
                    <td className="max-w-[300px] px-4 py-4 text-left text-[11px] leading-5 text-muted-foreground">
                      {item.thesis ?? "No thesis saved yet."}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <WatchlistStar
                        assetId={item.assetId}
                        assetName={name}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.some(({ coin }) => coin === null) && (
          <div className="border-t border-white/[0.05] px-5 py-3 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground sm:px-6">
            Some saved assets are outside the current market universe. They
            remain saved and will not be silently removed.
          </div>
        )}
      </section>
    </>
  );
}
