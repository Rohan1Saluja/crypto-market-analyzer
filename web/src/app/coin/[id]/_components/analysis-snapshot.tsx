import { Activity, Gauge, Waves } from "lucide-react";

import type { TechnicalSnapshot } from "@/types/coin";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value < 100 ? 2 : 0,
  }).format(value);
}

function toneClass(value: string) {
  if (value === "Bullish") {
    return "signal-positive";
  }

  if (value === "Bearish") {
    return "signal-negative";
  }

  return "signal-neutral";
}

export function AnalysisSnapshot({
  symbol,
  technicals,
}: {
  symbol: string;
  technicals: TechnicalSnapshot | null;
}) {
  if (!technicals) {
    return (
      <aside className="spectral-panel spectral-edge rounded-3xl px-5 py-5 sm:px-6">
        <div className="data-label">Technical lens</div>
        <h2 className="mt-1 font-heading text-base font-medium tracking-[-0.025em]">
          Signal snapshot
        </h2>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          There is not enough historical data available to calculate the technical snapshot for {symbol}.
        </p>
      </aside>
    );
  }

  const rsiPosition = `${Math.max(0, Math.min(100, technicals.rsi))}%`;

  return (
    <aside className="spectral-panel spectral-edge rounded-3xl">
      <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
        <div className="data-label">Technical lens</div>
        <div className="mt-1 flex items-center gap-2">
          <h2 className="font-heading text-base font-medium tracking-[-0.025em]">
            Signal snapshot
          </h2>
          <Gauge className="size-3.5 text-[var(--spectral-violet)]" />
        </div>
        <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
          Calculated from real hourly history for {symbol}.
        </p>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="data-label text-[8px]!">Momentum</span>
              <Activity className="size-3 text-muted-foreground" />
            </div>
            <div className={`mt-3 font-heading text-sm font-medium ${toneClass(technicals.momentum)}`}>
              {technicals.momentum}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="data-label text-[8px]!">MACD bias</span>
              <Waves className="size-3 text-muted-foreground" />
            </div>
            <div className={`mt-3 font-heading text-sm font-medium ${toneClass(technicals.macd)}`}>
              {technicals.macd}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="data-label">Relative strength</div>
              <div className="mt-1 font-heading text-sm font-medium">RSI</div>
            </div>
            <span className="number-display font-mono text-sm text-foreground">
              {technicals.rsi}
            </span>
          </div>

          <div className="relative h-2 rounded-full bg-[linear-gradient(90deg,var(--negative)_0%,oklch(0.45_0.04_292)_50%,var(--positive)_100%)] opacity-80">
            <div
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--background)] bg-foreground shadow-[0_0_0_3px_rgba(255,255,255,0.06)] transition-[left] duration-500"
              style={{ left: rsiPosition }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.07em] text-muted-foreground">
            <span>Oversold</span>
            <span>Neutral</span>
            <span>Overbought</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-3 xl:grid-cols-1">
          <div className="flex items-end justify-between gap-3">
            <div className="data-label text-[8px]!">Support</div>
            <div className="number-display text-xs font-medium">
              {formatPrice(technicals.support)}
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="data-label text-[8px]!">Resistance</div>
            <div className="number-display text-xs font-medium">
              {formatPrice(technicals.resistance)}
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="data-label text-[8px]!">Volatility</div>
              <div className="mt-1 font-mono text-[8px] text-muted-foreground">
                {technicals.volatilityAnnualized.toFixed(1)}% annualized
              </div>
            </div>
            <div className="text-xs font-medium">{technicals.volatility}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
