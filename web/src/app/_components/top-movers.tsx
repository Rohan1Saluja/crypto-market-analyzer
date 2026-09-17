import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketCoin } from "@/types/market";

function formatPrice(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value >= 1000 ? 0 : 2,
  }).format(value);
}

export function TopMovers({ coins }: { coins: MarketCoin[] }) {
  const topMovers = [...coins]
    .filter((coin) => coin.change24h !== null)
    .sort(
      (a, b) =>
        Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0),
    )
    .slice(0, 5);

  return (
    <Card className="h-fit">
      <CardHeader className="border-b pb-3">
        <div>
          <CardTitle>Top movers</CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Largest absolute 24h moves in the live market feed
          </p>
        </div>
      </CardHeader>

      <CardContent className="divide-y px-0">
        {topMovers.map((coin) => {
          const change = coin.change24h ?? 0;
          const positive = change >= 0;

          return (
            <div key={coin.id} className="flex items-center gap-3 px-4 py-3">
              <Link
                href={`/coin/${coin.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                  {coin.symbol.slice(0, 2)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{coin.name}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {coin.symbol}
                  </div>
                </div>
              </Link>

              <div className="text-right">
                <div className="text-xs font-medium tabular-nums">
                  {formatPrice(coin.price)}
                </div>
                <div
                  className={
                    positive
                      ? "mt-0.5 flex items-center justify-end gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                      : "mt-0.5 flex items-center justify-end gap-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400"
                  }
                >
                  {positive ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {positive ? "+" : ""}
                  {change.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}

        {topMovers.length === 0 && (
          <div className="px-4 py-6 text-xs text-muted-foreground">
            24h movement data is currently unavailable.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
