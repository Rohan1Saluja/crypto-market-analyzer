import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Orbit } from "lucide-react";

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

function AssetMark({ coin }: { coin: MarketCoin }) {
  if (coin.imageUrl) {
    return (
      <Image
        src={coin.imageUrl}
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-full"
      />
    );
  }

  return (
    <span className="flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] font-mono text-[9px] font-semibold uppercase text-foreground/80">
      {coin.symbol.slice(0, 2)}
    </span>
  );
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
    <aside className="spectral-panel spectral-edge h-fit rounded-3xl">
      <div className="border-b border-white/[0.06] px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="data-label">Signal scan</div>
            <h2 className="mt-1 font-heading text-base font-medium tracking-[-0.025em]">
              Top movers
            </h2>
          </div>
          <span className="flex size-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[var(--spectral-glacier)]">
            <Orbit className="size-4" />
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
          Largest absolute 24h moves in the current market universe.
        </p>
      </div>

      <div className="divide-y divide-white/[0.055]">
        {topMovers.map((coin, index) => {
          const change = coin.change24h ?? 0;
          const positive = change >= 0;

          return (
            <div
              key={coin.id}
              className="group relative flex items-center gap-3 px-5 py-4 transition-colors duration-300 hover:bg-white/[0.025]"
            >
              <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[8px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                0{index + 1}
              </span>

              <Link
                href={`/coin/${coin.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <span className="transition-transform duration-300 group-hover:scale-105">
                  <AssetMark coin={coin} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-foreground/95">
                    {coin.name}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                    {coin.symbol}
                  </div>
                </div>
              </Link>

              <div className="text-right">
                <div className="number-display text-xs font-medium">
                  {formatPrice(coin.price)}
                </div>
                <div
                  className={
                    positive
                      ? "signal-positive mt-1 flex items-center justify-end gap-0.5 font-mono text-[9px] font-medium"
                      : "signal-negative mt-1 flex items-center justify-end gap-0.5 font-mono text-[9px] font-medium"
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
          <div className="px-5 py-8 text-xs leading-5 text-muted-foreground">
            24h movement data is currently unavailable.
          </div>
        )}
      </div>
    </aside>
  );
}
