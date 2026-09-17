import { Card, CardContent } from "@/components/ui/card";
import type { CoinMetric } from "../_data/coin-detail";

export function CoinMetrics({ metrics }: { metrics: CoinMetric[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="py-4">
          <CardContent>
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {metric.label}
            </div>
            <div className="mt-2 text-lg font-semibold tracking-tight tabular-nums">
              {metric.value}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {metric.helper}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
