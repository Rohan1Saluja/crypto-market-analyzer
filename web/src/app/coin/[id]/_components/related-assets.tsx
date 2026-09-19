import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";

import { WatchlistStar } from "@/components/watchlist/watchlist-star";
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

function nearbyAssets(coins: MarketCoin[], currentId: string) {
  const ranked = [...coins]
    .filter((coin) => coin.rank !== null)
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER));

  const index = ranked.findIndex((coin) => coin.id === currentId);

  if (index === -1) {
    return ranked.filter((coin) => coin.id !== currentId).slice(0, 4);
  }

  const start = Math.min(
    Math.max(index - 2, 0),
    Math.max(ranked.length - 5, 0),
  );

  return ranked
    .slice(start, start + 5)
    .filter((coin) => coin.id !== currentId)
    .slice(0, 4);
}

export function RelatedAssets({
  coins,
  currentId,
}: {
  coins: MarketCoin[];
  currentId: string;
}) {
  const related = nearbyAssets(coins, currentId);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="calyrn-panel calyrn-edge mt-5 rounded-3xl px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="size-3.5 text-[var(--calyrn-ice)]" />
            <span className="data-label">Continue research</span>
          </div>
          <h2 className="mt-1 font-heading text-lg font-medium tracking-[-0.03em]">
            Explore nearby assets
          </h2>
          <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
            Nearby by market-cap rank, so you can move through the market without returning to discovery.
          </p>
        </div>

        <Link
          href="/research"
          className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Full research universe
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="grid gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-4">
        {related.map((coin) => {
          const positive = (coin.change24h ?? 0) >= 0;

          return (
            <article
              key={coin.id}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-4 transition-colors hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/coin/${coin.id}`}
                  className="flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {coin.imageUrl ? (
                    <Image
                      src={coin.imageUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 rounded-full"
                    />
                  ) : (
                    <span className="flex size-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] font-mono text-[9px] font-semibold uppercase">
                      {coin.symbol.slice(0, 2)}
                    </span>
                  )}

                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-foreground">
                      {coin.name}
                    </div>
                    <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                      {coin.symbol}
                      {coin.rank !== null ? ` · #${coin.rank}` : ""}
                    </div>
                  </div>
                </Link>

                <WatchlistStar assetId={coin.id} assetName={coin.name} />
              </div>

              <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.05] pt-3">
                <div>
                  <div className="data-label text-[8px]!">Spot</div>
                  <div className="number-display mt-1 text-xs font-medium">
                    {formatPrice(coin.price)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="data-label text-[8px]!">24h</div>
                  <div
                    className={
                      positive
                        ? "signal-positive mt-1 font-mono text-[9px] font-medium"
                        : "signal-negative mt-1 font-mono text-[9px] font-medium"
                    }
                  >
                    {coin.change24h === null
                      ? "—"
                      : `${positive ? "+" : ""}${coin.change24h.toFixed(2)}%`}
                  </div>
                </div>
              </div>

              <Link
                href={`/coin/${coin.id}`}
                className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:bg-white/[0.035] hover:text-foreground"
              >
                Open research
                <ArrowUpRight className="size-3" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
