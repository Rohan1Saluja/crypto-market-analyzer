import { Activity, ArrowUpRight } from "lucide-react";

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
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1480px] px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <section className="instrument-enter relative overflow-hidden pb-8 pt-2">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="data-label">CMA / Markets / Live</span>
              <span className="h-px w-8 bg-white/10" />
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                <Activity className="size-3 text-[var(--spectral-glacier)]" />
                Global market feed
              </span>
            </div>

            <h1 className="max-w-4xl font-heading text-[clamp(2.65rem,7vw,6.4rem)] font-medium leading-[0.9] tracking-[-0.065em] text-foreground">
              Read the market,
              <span className="block bg-[linear-gradient(90deg,var(--foreground)_0%,var(--spectral-glacier)_42%,var(--spectral-violet)_78%,var(--spectral-peach)_110%)] bg-clip-text text-transparent">
                not the noise.
              </span>
            </h1>

            <div className="mt-6 flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                A research-first view of crypto markets built for discovery,
                context, and deeper asset analysis—not just price watching.
              </p>

              <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
                <span className="status-orb size-2 rounded-full bg-[var(--positive)]" />
                <span>Market systems online</span>
              </div>
            </div>
          </div>
        </section>

        <section className="spectral-panel spectral-edge instrument-enter-delayed rounded-3xl">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="data-label">Market atmosphere</div>
              <h2 className="mt-1 font-heading text-lg font-medium tracking-[-0.03em]">
                Global crypto state
              </h2>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Live intelligence layer</span>
              <ArrowUpRight className="size-3.5 text-[var(--spectral-glacier)]" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {marketStats.map((stat, index) => (
              <MarketStatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <MarketTable coins={marketCoins} />
          <TopMovers coins={marketCoins} />
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>CMA / Crypto Market Analyzer</span>
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
