import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { MarketStat } from "@/types/market";

export function MarketStatCard({
  stat,
  index,
}: {
  stat: MarketStat;
  index: number;
}) {
  const isPositive = (stat.change ?? 0) >= 0;

  return (
    <article
      className="group relative min-h-40 border-b border-white/[0.06] px-5 py-5 transition-colors duration-300 hover:bg-white/[0.018] sm:px-6 xl:border-b-0 xl:border-r xl:last:border-r-0"
      style={{ animationDelay: `${140 + index * 55}ms` }}
    >
      <div className="absolute inset-x-6 top-0 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,var(--spectral-violet),var(--spectral-glacier),transparent)] transition-transform duration-500 group-hover:scale-x-100" />

      <div className="data-label">{stat.label}</div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div className="number-display font-heading text-2xl font-medium sm:text-[1.7rem]">
          {stat.value}
        </div>

        {typeof stat.change === "number" && (
          <div
            className={
              isPositive
                ? "signal-positive flex items-center gap-1 font-mono text-[10px] font-medium"
                : "signal-negative flex items-center gap-1 font-mono text-[10px] font-medium"
            }
          >
            {isPositive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(stat.change).toFixed(2)}%
          </div>
        )}
      </div>

      <p className="mt-3 max-w-[19rem] text-[11px] leading-5 text-muted-foreground">
        {stat.helper}
      </p>
    </article>
  );
}
