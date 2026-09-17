import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { topMovers } from "@/data/market";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value >= 1000 ? 0 : 2,
  }).format(value);
}

export function TopMovers() {
  return (
    <Card className="h-fit">
      <CardHeader className="border-b pb-3">
        <div>
          <CardTitle>Top movers</CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Strongest 24h moves in this demo snapshot
          </p>
        </div>
      </CardHeader>

      <CardContent className="divide-y px-0">
        {topMovers.map((coin) => (
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
              <div className="mt-0.5 flex items-center justify-end gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-3" />
                {coin.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
