import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CoinDetail } from "../_data/coin-detail";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value < 100 ? 2 : 0,
  }).format(value);
}

export function CoinHeader({ detail }: { detail: CoinDetail }) {
  const { coin } = detail;
  const positive = coin.change24h >= 0;

  return (
    <section className="border-b pb-6">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to markets
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Rank #{coin.rank}</Badge>
            <Badge variant="secondary">Demo data</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
              {coin.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {coin.name}
                </h1>
                <span className="text-sm font-medium uppercase text-muted-foreground">
                  {coin.symbol}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                {detail.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="text-left lg:text-right">
            <div className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatPrice(coin.price)}
            </div>
            <div
              className={
                positive
                  ? "mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600 lg:justify-end dark:text-emerald-400"
                  : "mt-1 flex items-center gap-1 text-xs font-medium text-rose-600 lg:justify-end dark:text-rose-400"
              }
            >
              {positive ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {positive ? "+" : ""}
              {coin.change24h.toFixed(2)}% today
            </div>
          </div>

          <Button variant="outline" size="icon" aria-label={`Add ${coin.name} to watchlist`}>
            <Star className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
