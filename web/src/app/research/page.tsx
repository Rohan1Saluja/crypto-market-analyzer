import type { Metadata } from "next";
import { BookOpen, Layers3, Newspaper, Radio, ScanLine } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { marketService } from "@/services/market.service";
import { ResearchExplorer } from "./_components/research-explorer";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Investigate crypto assets across market structure, technicals, fundamentals, news and sentiment on Calyrn.",
};

const lenses = [
  {
    icon: ScanLine,
    label: "Technicals",
    body: "Price structure and momentum derived from market history.",
  },
  {
    icon: Layers3,
    label: "Fundamentals",
    body: "Supply, network and project context from the research layer.",
  },
  {
    icon: Newspaper,
    label: "Events",
    body: "Recent asset-specific news without turning Calyrn into a feed.",
  },
  {
    icon: Radio,
    label: "Sentiment",
    body: "Provider-reported participation and community context.",
  },
];

export default async function ResearchPage() {
  const coins = await marketService.getMarkets();

  return (
    <div className="min-h-screen">
      <AppHeader coins={coins} />

      <main className="mx-auto w-full max-w-[1480px] px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <section className="instrument-enter pb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="data-label">Calyrn / Research</span>
            <span className="h-px w-8 bg-white/10" />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.022] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              <BookOpen className="size-3 text-[var(--calyrn-ice)]" />
              Evidence before action
            </span>
          </div>

          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-end">
            <div>
              <h1 className="max-w-3xl font-heading text-4xl font-medium tracking-[-0.055em] sm:text-6xl">
                Investigate the asset,
                <span className="block text-foreground/55">
                  not just the ticker.
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                Research is Calyrn&apos;s evidence layer. Start from the market
                universe, then move into technical, fundamental, event and
                participation context for a specific asset.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {lenses.map((lens) => {
                const Icon = lens.icon;

                return (
                  <div
                    key={lens.label}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-3.5"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-[var(--calyrn-jade)]" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-foreground/85">
                        {lens.label}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                      {lens.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <ResearchExplorer coins={coins} />

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Calyrn / Research</span>
          <span>{coins.length} assets · Current market universe</span>
        </footer>
      </main>
    </div>
  );
}
