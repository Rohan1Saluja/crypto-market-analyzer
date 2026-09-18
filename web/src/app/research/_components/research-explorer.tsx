"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { WatchlistStar } from "@/components/watchlist/watchlist-star";
import type { MarketCoin } from "@/types/market";

function formatCurrency(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value >= 1000 ? 0 : 2,
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

export function ResearchExplorer({ coins }: { coins: MarketCoin[] }) {
  const [query, setQuery] = useState("");

  const visibleCoins = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return coins;
    }

    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(normalized) ||
        coin.symbol.toLowerCase().includes(normalized) ||
        coin.id.toLowerCase().includes(normalized),
    );
  }, [coins, query]);

  return (
    <section className="calyrn-panel calyrn-edge overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <div className="data-label">Research universe</div>
          <h2 className="mt-1 font-heading text-lg font-medium tracking-[-0.03em]">
            Choose an asset to investigate
          </h2>
          <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-muted-foreground">
            Open technicals, fundamentals, news, sentiment and market context
            from one asset research surface.
          </p>
        </div>

        <label className="group/search relative flex h-9 items-center rounded-xl border border-white/[0.07] bg-black/10 transition-all focus-within:border-ring/40 focus-within:bg-white/[0.035] focus-within:ring-2 focus-within:ring-ring/10">
          <Search className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground group-focus-within/search:text-[var(--calyrn-ice)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search research"
            className="h-full w-full bg-transparent pl-9 pr-3 text-[11px] text-foreground outline-none placeholder:text-muted-foreground sm:w-64"
            aria-label="Search research assets"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-black/[0.08] font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
              <th className="w-16 px-5 py-3 text-left font-medium">Rank</th>
              <th className="px-3 py-3 text-left font-medium">Asset</th>
              <th className="px-3 py-3 text-right font-medium">Price</th>
              <th className="px-3 py-3 text-right font-medium">24h</th>
              <th className="px-3 py-3 text-right font-medium">7d</th>
              <th className="px-3 py-3 text-right font-medium">Research</th>
              <th className="w-16 px-5 py-3 text-center font-medium">Watch</th>
            </tr>
          </thead>

          <tbody>
            {visibleCoins.map((coin) => (
              <tr
                key={coin.id}
                className="group/row border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.025]"
              >
                <td className="px-5 py-3.5 font-mono text-[9px] text-muted-foreground">
                  {coin.rank ?? "—"}
                </td>

                <td className="px-3 py-3.5">
                  <Link
                    href={`/coin/${coin.id}`}
                    className="flex w-fit items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {coin.imageUrl ? (
                      <Image
                        src={coin.imageUrl}
                        alt=""
                        width={34}
                        height={34}
                        className="size-[34px] rounded-full transition-transform group-hover/row:scale-105"
                      />
                    ) : (
                      <span className="flex size-[34px] items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] font-mono text-[9px] font-semibold uppercase">
                        {coin.symbol.slice(0, 2)}
                      </span>
                    )}

                    <div>
                      <div className="font-medium text-foreground/95">
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
                  <Change value={coin.change24h} />
                </td>
                <td className="px-3 py-3.5 text-right">
                  <Change value={coin.change7d} />
                </td>
                <td className="px-3 py-3.5 text-right">
                  <Link
                    href={`/coin/${coin.id}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    Open
                    <ArrowUpRight className="size-3" />
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <WatchlistStar assetId={coin.id} assetName={coin.name} />
                </td>
              </tr>
            ))}

            {visibleCoins.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-14 text-center text-xs text-muted-foreground"
                >
                  No research assets match “{query.trim()}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3 font-mono text-[8px] uppercase tracking-[0.09em] text-muted-foreground sm:px-6">
        <span>{visibleCoins.length} assets visible</span>
        <span>Technicals · Fundamentals · News · Sentiment</span>
      </div>
    </section>
  );
}
