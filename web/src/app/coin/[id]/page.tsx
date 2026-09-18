import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { coinService } from "@/services/coin.service";
import { AnalysisSnapshot } from "./_components/analysis-snapshot";
import { CoinHeader } from "./_components/coin-header";
import { CoinMetrics } from "./_components/coin-metrics";
import { PriceChart } from "./_components/price-chart";
import { ResearchLayer } from "./_components/research-layer";

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

  const [priceHistory, technicals, research, news] = await Promise.all([
    coinService.getPriceHistory(id, "7d"),
    coinService.getTechnicals(id),
    coinService.getResearch(id),
    coinService.getNews(id),
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

        <ResearchLayer
          detail={detail}
          research={research}
          technicals={technicals}
          news={news}
        />

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
