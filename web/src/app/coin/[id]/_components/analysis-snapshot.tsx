import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TechnicalSnapshot } from "@/types/coin";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value < 100 ? 2 : 0,
  }).format(value);
}

function Tone({ value }: { value: string }) {
  const bullish = value === "Bullish";
  const bearish = value === "Bearish";

  return (
    <span
      className={
        bullish
          ? "font-medium text-emerald-600 dark:text-emerald-400"
          : bearish
            ? "font-medium text-rose-600 dark:text-rose-400"
            : "font-medium text-foreground"
      }
    >
      {value}
    </span>
  );
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
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle>Technical snapshot</CardTitle>
        </CardHeader>
        <CardContent className="text-xs leading-5 text-muted-foreground">
          There is not enough real historical data available to calculate the
          technical snapshot for {symbol}.
        </CardContent>
      </Card>
    );
  }

  const rsiPosition = `${Math.max(0, Math.min(100, technicals.rsi))}%`;

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <div>
          <CardTitle>Technical snapshot</CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Calculated from real hourly market history for {symbol}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Momentum
            </div>
            <div className="mt-2 text-sm">
              <Tone value={technicals.momentum} />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              MACD bias
            </div>
            <div className="mt-2 text-sm">
              <Tone value={technicals.macd} />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium">RSI</span>
            <span className="font-mono tabular-nums">{technicals.rsi}</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted">
            <div
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground"
              style={{ left: rsiPosition }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[9px] uppercase text-muted-foreground">
            <span>Oversold</span>
            <span>Neutral</span>
            <span>Overbought</span>
          </div>
        </div>

        <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Support
            </div>
            <div className="mt-1 text-xs font-medium tabular-nums">
              {formatPrice(technicals.support)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Resistance
            </div>
            <div className="mt-1 text-xs font-medium tabular-nums">
              {formatPrice(technicals.resistance)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Volatility
            </div>
            <div className="mt-1 text-xs font-medium">
              {technicals.volatility}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {technicals.volatilityAnnualized.toFixed(1)}% annualized
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
