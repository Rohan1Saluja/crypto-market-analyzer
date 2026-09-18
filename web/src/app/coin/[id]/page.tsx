import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { coinService } from "@/services/coin.service";
import { AnalysisSnapshot } from "./_components/analysis-snapshot";
import { CoinHeader } from "./_components/coin-header";
import { CoinMetrics } from "./_components/coin-metrics";
import { PriceChart } from "./_components/price-chart";

type CoinPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CoinPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await coinService.getDetail(id);

  if (!detail) {
    return {
      title: "Asset not found",
    };
  }

  return {
    title: `${detail.coin.name} (${detail.coin.symbol})`,
    description:
      detail.description ??
      `${detail.coin.name} market data and technical analysis.`,
  };
}

export default async function CoinPage({ params }: CoinPageProps) {
  const { id } = await params;
  const detail = await coinService.getDetail(id);

  if (!detail) {
    notFound();
  }

  const [priceHistory, technicals] = await Promise.all([
    coinService.getPriceHistory(id, "7d"),
    coinService.getTechnicals(id),
  ]);

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1480px] px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <CoinHeader detail={detail} />

        <div className="mt-5">
          <CoinMetrics metrics={detail.metrics} />
        </div>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
          <PriceChart symbol={detail.coin.symbol} data={priceHistory ?? []} />
          <AnalysisSnapshot symbol={detail.coin.symbol} technicals={technicals} />
        </section>

        <section className="spectral-panel spectral-edge mt-5 rounded-3xl px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
            <div>
              <div className="data-label">Research layer</div>
              <h2 className="mt-1 font-heading text-base font-medium tracking-[-0.025em]">
                About {detail.coin.name}
              </h2>
              <div className="mt-4 flex flex-wrap gap-1.5 lg:flex-col lg:items-start">
                {["Overview", "Technicals", "Fundamentals", "News", "Sentiment"].map(
                  (item, index) => (
                    <span
                      key={item}
                      className={
                        index === 0
                          ? "rounded-lg border border-white/[0.08] bg-white/[0.07] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-foreground"
                          : "rounded-lg px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground"
                      }
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <p className="max-w-4xl text-sm leading-7 text-foreground/74">
                {detail.description ??
                  "Description unavailable from the market-data provider."}
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>CMA / Asset research</span>
          <span>
            Market data by{" "}
            <a
              href="https://www.coingecko.com/"
              target="_blank"
              rel="noreferrer"
              className="text-foreground/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-foreground"
            >
              CoinGecko
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}
