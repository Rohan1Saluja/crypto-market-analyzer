import type { Metadata } from "next";
import { Bookmark } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { marketService } from "@/services/market.service";
import { WatchContent } from "./_components/watch-content";

export const metadata: Metadata = {
  title: "Watch",
  description:
    "Your saved crypto assets with live market context on Calyrn.",
};

export default async function WatchPage() {
  const coins = await marketService.getMarkets();

  return (
    <div className="min-h-screen">
      <AppHeader coins={coins} />

      <main className="mx-auto w-full max-w-[1480px] px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <section className="instrument-enter pb-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="data-label">Calyrn / Watch</span>
            <span className="h-px w-8 bg-white/10" />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.022] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              <Bookmark className="size-3 text-[var(--calyrn-amber)]" />
              Personal market context
            </span>
          </div>

          <h1 className="font-heading text-4xl font-medium tracking-[-0.055em] sm:text-5xl">
            Watch
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Keep the assets you care about close. Watch combines your saved
            names with the live public market layer without duplicating market
            data into your account.
          </p>
        </section>

        <WatchContent coins={coins} />

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Calyrn / Watch</span>
          <span>Private state · Live market context</span>
        </footer>
      </main>
    </div>
  );
}
