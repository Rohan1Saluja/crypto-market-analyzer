"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WatchlistStar } from "@/components/watchlist/watchlist-star";
import type { MarketCoin } from "@/types/market";

type Filter = "all" | "gainers" | "losers";

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Gainers", value: "gainers" },
  { label: "Losers", value: "losers" },
];

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

function formatCompact(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `$${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function AssetMark({ coin }: { coin: MarketCoin }) {
  if (coin.imageUrl) {
    return (
      <Image
        src={coin.imageUrl}
        alt=""
        width={34}
        height={34}
        className="size-[34px] rounded-full transition-transform duration-300 group-hover/row:scale-105"
      />
    );
  }

  return (
    <span className="flex size-[34px] items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] font-mono text-[9px] font-semibold uppercase text-foreground/80 transition-transform duration-300 group-hover/row:scale-105">
      {coin.symbol.slice(0, 2)}
    </span>
  );
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
          ? "signal-positive inline-flex items-center justify-end gap-0.5 font-mono text-[10px] font-medium tabular-nums"
          : "signal-negative inline-flex items-center justify-end gap-0.5 font-mono text-[10px] font-medium tabular-nums"
      }
    >
      {positive ? (
        <ArrowUpRight className="size-3 opacity-70" />
      ) : (
        <ArrowDownRight className="size-3 opacity-70" />
      )}
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

function Sparkline({
  values,
  positive,
}: {
  values: number[];
  positive: boolean;
}) {
  if (values.length < 2) {
    return <span className="text-muted-foreground">—</span>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 112 + 4;
      const y = 34 - ((value - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 120 40"
      className={
        positive
          ? "h-8 w-24 text-[var(--positive)] opacity-65 transition-all duration-300 group-hover/row:scale-105 group-hover/row:opacity-100"
          : "h-8 w-24 text-[var(--negative)] opacity-65 transition-all duration-300 group-hover/row:scale-105 group-hover/row:opacity-100"
      }
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MarketTable({ coins }: { coins: MarketCoin[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visibleCoins = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return coins.filter((coin) => {
      const matchesSearch =
        !normalizedQuery ||
        coin.name.toLowerCase().includes(normalizedQuery) ||
        coin.symbol.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        filter === "all" ||
        (filter === "gainers" &&
          coin.change24h !== null &&
          coin.change24h >= 0) ||
        (filter === "losers" &&
          coin.change24h !== null &&
          coin.change24h < 0);

      return matchesSearch && matchesFilter;
    });
  }, [coins, filter, query]);

  return (
    <section className="spectral-panel spectral-edge min-w-0 rounded-3xl">
      <div className="flex flex-col gap-5 border-b border-white/[0.06] px-5 py-5 md:flex-row md:items-end md:justify-between md:px-6">
        <div>
          <div className="data-label">Market universe</div>
          <h2 className="mt-1 font-heading text-lg font-medium tracking-[-0.03em]">
            Live assets
          </h2>
          <p className="mt-1.5 max-w-lg text-[11px] leading-5 text-muted-foreground">
            Scan price, momentum, liquidity and recent structure before opening a deeper asset view.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="group/search relative flex h-9 items-center rounded-xl border border-white/[0.07] bg-black/10 transition-all duration-300 focus-within:border-ring/40 focus-within:bg-white/[0.035] focus-within:ring-2 focus-within:ring-ring/10">
            <Search className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground transition-colors group-focus-within/search:text-[var(--spectral-glacier)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets"
              className="h-full w-full bg-transparent pl-9 pr-3 text-[11px] text-foreground outline-none placeholder:text-muted-foreground sm:w-56"
              aria-label="Search market assets"
            />
          </label>

          <div className="flex h-9 items-center rounded-xl border border-white/[0.07] bg-black/10 p-1">
            {filters.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant="ghost"
                onClick={() => setFilter(item.value)}
                className={
                  filter === item.value
                    ? "h-7 rounded-lg bg-white/[0.08] px-3 text-[10px] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-white/[0.1]"
                    : "h-7 rounded-lg px-3 text-[10px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                }
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-black/[0.08] font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
              <th className="w-14 px-4 py-3 text-center font-medium">#</th>
              <th className="px-3 py-3 text-left font-medium">Asset</th>
              <th className="px-3 py-3 text-right font-medium">Price</th>
              <th className="px-3 py-3 text-right font-medium">1h</th>
              <th className="px-3 py-3 text-right font-medium">24h</th>
              <th className="px-3 py-3 text-right font-medium">7d</th>
              <th className="px-3 py-3 text-right font-medium">Market cap</th>
              <th className="px-3 py-3 text-right font-medium">24h volume</th>
              <th className="px-5 py-3 text-right font-medium">Last 7d</th>
            </tr>
          </thead>

          <tbody>
            {visibleCoins.map((coin) => (
              <tr
                key={coin.id}
                className="group/row border-b border-white/[0.05] transition-colors duration-300 last:border-0 hover:bg-white/[0.025]"
              >
                <td className="px-4 py-3.5 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <WatchlistStar
                      assetId={coin.id}
                      assetName={coin.name}
                    />
                    <span className="w-4 font-mono text-[9px] tabular-nums">
                      {coin.rank ?? "—"}
                    </span>
                  </div>
                </td>

                <td className="px-3 py-3.5">
                  <Link
                    href={`/coin/${coin.id}`}
                    className="flex w-fit items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <AssetMark coin={coin} />
                    <div>
                      <div className="font-medium text-foreground/95 transition-colors group-hover/row:text-white">
                        {coin.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                        {coin.symbol}
                      </div>
                    </div>
                  </Link>
                </td>

                <td className="number-display px-3 py-3.5 text-right font-medium">
                  {formatCurrency(coin.price)}
                </td>
                <td className="px-3 py-3.5 text-right">
                  <Change value={coin.change1h} />
                </td>
                <td className="px-3 py-3.5 text-right">
                  <Change value={coin.change24h} />
                </td>
                <td className="px-3 py-3.5 text-right">
                  <Change value={coin.change7d} />
                </td>
                <td className="number-display px-3 py-3.5 text-right text-foreground/78">
                  {formatCompact(coin.marketCap)}
                </td>
                <td className="number-display px-3 py-3.5 text-right text-foreground/68">
                  {formatCompact(coin.volume24h)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end">
                    <Sparkline
                      values={coin.sparkline}
                      positive={(coin.change7d ?? 0) >= 0}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {visibleCoins.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-14 text-center text-xs text-muted-foreground"
                >
                  No assets match your current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3 font-mono text-[8px] uppercase tracking-[0.09em] text-muted-foreground md:px-6">
        <span>{visibleCoins.length} assets visible</span>
        <span>Price · Momentum · Liquidity</span>
      </div>
    </section>
  );
}
