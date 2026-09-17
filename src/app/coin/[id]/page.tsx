import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AnalysisSnapshot } from "./_components/analysis-snapshot";
import { CoinHeader } from "./_components/coin-header";
import { CoinMetrics } from "./_components/coin-metrics";
import { PriceChart } from "./_components/price-chart";
import { getCoinDetail } from "./_data/coin-detail";

type CoinPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CoinPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = getCoinDetail(id);

  if (!detail) {
    return {
      title: "Asset not found",
    };
  }

  return {
    title: `${detail.coin.name} (${detail.coin.symbol})`,
    description: detail.description,
  };
}

export default async function CoinPage({ params }: CoinPageProps) {
  const { id } = await params;
  const detail = getCoinDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8">
        <CoinHeader detail={detail} />

        <div className="mt-4">
          <CoinMetrics metrics={detail.metrics} />
        </div>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <PriceChart
            symbol={detail.coin.symbol}
            data={detail.priceHistory}
          />
          <AnalysisSnapshot detail={detail} />
        </section>

        <section className="mt-4 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap gap-1 border-b pb-3">
            {["Overview", "Technicals", "Fundamentals", "News", "Sentiment"].map(
              (item, index) => (
                <span
                  key={item}
                  className={
                    index === 0
                      ? "rounded-md bg-muted px-3 py-1.5 text-xs font-medium"
                      : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  }
                >
                  {item}
                </span>
              ),
            )}
          </div>

          <div className="grid gap-5 pt-4 md:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <h2 className="text-sm font-medium">About {detail.coin.name}</h2>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">
                {detail.description} This route is intentionally structured around
                backend-ready data contracts so live market data, historical candles,
                fundamentals, news, and calculated indicators can be supplied by
                FastAPI without rebuilding the page.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                Next backend contract
              </div>
              <div className="mt-2 font-mono text-[11px] leading-5 text-foreground">
                GET /coins/{detail.coin.id}
                <br />
                GET /coins/{detail.coin.id}/candles
                <br />
                GET /coins/{detail.coin.id}/technicals
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
