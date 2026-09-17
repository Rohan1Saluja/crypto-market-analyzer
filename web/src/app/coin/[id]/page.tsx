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
            data={priceHistory ?? []}
          />
          <AnalysisSnapshot
            symbol={detail.coin.symbol}
            technicals={technicals}
          />
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

          <div className="grid gap-5 pt-4 md:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h2 className="text-sm font-medium">About {detail.coin.name}</h2>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">
                {detail.description ??
                  "Description unavailable from the market-data provider."}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                Live API contracts
              </div>
              <div className="mt-2 font-mono text-[11px] leading-5 text-foreground">
                GET /api/v1/coins/{detail.coin.id}
                <br />
                GET /api/v1/coins/{detail.coin.id}/price-history
                <br />
                GET /api/v1/coins/{detail.coin.id}/technicals
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-6 border-t pt-4 text-[10px] text-muted-foreground">
          Market data provided by{" "}
          <a
            href="https://www.coingecko.com/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            CoinGecko
          </a>
          .
        </footer>
      </main>
    </div>
  );
}
