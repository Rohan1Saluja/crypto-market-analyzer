import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/layout/app-header";
import { marketService } from "@/services/market.service";
import { MarketStatCard } from "./_components/market-stat-card";
import { MarketTable } from "./_components/market-table";
import { TopMovers } from "./_components/top-movers";

export default async function Home() {
  const [marketStats, marketCoins] = await Promise.all([
    marketService.getOverview(),
    marketService.getMarkets(),
  ]);

  return (
    <div className="min-h-screen bg-muted/20">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline">Market dashboard</Badge>
              <Badge variant="secondary">Live data</Badge>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Global crypto markets
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              A data-first workspace for market discovery, asset research, and
              technical analysis powered by the Crypto Market Analyzer API.
            </p>
          </div>

          <div className="text-left md:text-right">
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Market status
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium md:justify-end">
              <span className="size-2 rounded-full bg-emerald-500" />
              FastAPI feed online
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {marketStats.map((stat) => (
            <MarketStatCard key={stat.label} stat={stat} />
          ))}
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <MarketTable coins={marketCoins} />
          <TopMovers coins={marketCoins} />
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
