import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CoinDetail } from "@/types/coin";

function formatPrice(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value < 100 ? 2 : 0,
  }).format(value);
}

function summarizeDescription(description: string | null) {
  if (!description) {
    return "Description unavailable from the market-data provider.";
  }

  if (description.length <= 220) {
    return description;
  }

  return `${description.slice(0, 217).trimEnd()}…`;
}

export function CoinHeader({ detail }: { detail: CoinDetail }) {
  const { coin } = detail;
  const positive = (coin.change24h ?? 0) >= 0;

  return (
    <section className="instrument-enter">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ArrowLeft className="size-3.5" />
        Back to markets
      </Link>

      <div className="spectral-panel spectral-edge rounded-3xl px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                {coin.rank !== null ? `Rank #${coin.rank}` : "Unranked"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                <span className="status-orb size-1.5 rounded-full bg-[var(--positive)]" />
                Live market
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:size-16">
                {coin.imageUrl ? (
                  <Image
                    src={coin.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="size-10 rounded-full sm:size-12"
                  />
                ) : (
                  <span className="font-mono text-xs font-semibold uppercase">
                    {coin.symbol.slice(0, 2)}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="font-heading text-3xl font-medium tracking-[-0.055em] sm:text-5xl">
                    {coin.name}
                  </h1>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {coin.symbol}
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-[13px]">
                  {summarizeDescription(detail.description)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-5 lg:justify-end">
            <div className="lg:text-right">
              <div className="data-label mb-1.5">Spot price</div>
              <div className="number-display font-heading text-4xl font-medium tracking-[-0.055em] sm:text-5xl">
                {formatPrice(coin.price)}
              </div>
              {coin.change24h !== null && (
                <div
                  className={
                    positive
                      ? "signal-positive mt-2 flex items-center gap-1 font-mono text-[10px] font-medium lg:justify-end"
                      : "signal-negative mt-2 flex items-center gap-1 font-mono text-[10px] font-medium lg:justify-end"
                  }
                >
                  {positive ? (
                    <ArrowUpRight className="size-3.5" />
                  ) : (
                    <ArrowDownRight className="size-3.5" />
                  )}
                  {positive ? "+" : ""}
                  {coin.change24h.toFixed(2)}% / 24h
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl border-white/[0.08] bg-white/[0.025] text-muted-foreground transition-transform hover:scale-105 hover:bg-white/[0.06] hover:text-[var(--spectral-peach)] active:scale-95"
              aria-label={`Add ${coin.name} to watchlist`}
            >
              <Star className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
