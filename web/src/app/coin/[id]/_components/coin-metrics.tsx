import type { CoinMetric } from "@/types/coin";

export function CoinMetrics({ metrics }: { metrics: CoinMetric[] }) {
  return (
    <section className="spectral-panel spectral-edge grid overflow-hidden rounded-3xl sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="group min-h-32 border-b border-white/[0.06] px-5 py-5 transition-colors hover:bg-white/[0.018] sm:px-6 xl:border-b-0 xl:border-r xl:last:border-r-0"
        >
          <div className="data-label">{metric.label}</div>
          <div className="number-display mt-5 font-heading text-xl font-medium tracking-[-0.035em] sm:text-2xl">
            {metric.value}
          </div>
          <div className="mt-2 text-[10px] leading-5 text-muted-foreground">
            {metric.helper}
          </div>
          <div className="mt-4 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,var(--spectral-violet),var(--spectral-glacier),transparent)] transition-transform duration-500 group-hover:scale-x-100" />
        </article>
      ))}
    </section>
  );
}
