"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function Change({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const positive = value >= 0;

  return (
    <span
      className={
        positive
          ? "font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
          : "font-medium tabular-nums text-rose-600 dark:text-rose-400"
      }
    >
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
          ? "h-8 w-24 text-emerald-500"
          : "h-8 w-24 text-rose-500"
      }
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
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
    <Card className="gap-0 py-0">
      <CardHeader className="gap-4 border-b py-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <CardTitle>Markets</CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Search and scan live market data before drilling into asset-level analysis.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets"
              className="w-full pl-8 sm:w-56"
            />
          </div>

          <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
            {filters.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={filter === item.value ? "secondary" : "ghost"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto px-0">
        <table className="w-full min-w-[980px] border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/25 text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
              <th className="w-10 px-4 py-2.5 text-center font-medium">#</th>
              <th className="px-3 py-2.5 text-left font-medium">Asset</th>
              <th className="px-3 py-2.5 text-right font-medium">Price</th>
              <th className="px-3 py-2.5 text-right font-medium">1h</th>
              <th className="px-3 py-2.5 text-right font-medium">24h</th>
              <th className="px-3 py-2.5 text-right font-medium">7d</th>
              <th className="px-3 py-2.5 text-right font-medium">Market cap</th>
              <th className="px-3 py-2.5 text-right font-medium">24h volume</th>
              <th className="px-3 py-2.5 text-right font-medium">Last 7d</th>
            </tr>
          </thead>

          <tbody>
            {visibleCoins.map((coin) => (
              <tr
                key={coin.id}
                className="border-b transition-colors last:border-0 hover:bg-muted/20"
              >
                <td className="px-4 py-3 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      aria-label={`Add ${coin.name} to watchlist`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Star className="size-3.5" />
                    </button>
                    <span className="w-4 tabular-nums">{coin.rank ?? "—"}</span>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <Link
                    href={`/coin/${coin.id}`}
                    className="flex w-fit items-center gap-2.5 rounded-md outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{coin.name}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">
                        {coin.symbol}
                      </div>
                    </div>
                  </Link>
                </td>

                <td className="px-3 py-3 text-right font-medium tabular-nums">
                  {formatCurrency(coin.price)}
                </td>
                <td className="px-3 py-3 text-right">
                  <Change value={coin.change1h} />
                </td>
                <td className="px-3 py-3 text-right">
                  <Change value={coin.change24h} />
                </td>
                <td className="px-3 py-3 text-right">
                  <Change value={coin.change7d} />
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatCompact(coin.marketCap)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatCompact(coin.volume24h)}
                </td>
                <td className="px-3 py-3">
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
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No assets match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
