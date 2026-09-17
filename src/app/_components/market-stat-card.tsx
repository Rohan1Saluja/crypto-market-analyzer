import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { MarketStat } from "@/types/market";

export function MarketStatCard({ stat }: { stat: MarketStat }) {
  const isPositive = (stat.change ?? 0) >= 0;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="gap-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {stat.label}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <div className="text-xl font-semibold tracking-tight">{stat.value}</div>

          {typeof stat.change === "number" && (
            <div
              className={
                isPositive
                  ? "flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                  : "flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400"
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

        <p className="text-[11px] text-muted-foreground">{stat.helper}</p>
      </CardContent>
    </Card>
  );
}
