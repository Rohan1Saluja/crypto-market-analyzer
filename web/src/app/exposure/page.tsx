import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { marketService } from "@/services/market.service";
import { ExposureContent } from "./_components/exposure-content";

export const metadata: Metadata = {
  title: "Exposure",
  description:
    "Read-only crypto exposure across the Ethereum wallets you track with Calyrn.",
};

export default async function ExposurePage() {
  const coins = await marketService.getMarkets();

  return (
    <div className="min-h-screen">
      <AppHeader coins={coins} />

      <main className="mx-auto w-full max-w-[1480px] px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <section className="instrument-enter pb-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="data-label">Calyrn / Exposure</span>
            <span className="h-px w-8 bg-white/10" />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.022] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              <ShieldCheck className="size-3 text-[var(--calyrn-jade)]" />
              Read-only tracking
            </span>
          </div>

          <h1 className="font-heading text-4xl font-medium tracking-[-0.055em] sm:text-5xl">
            Exposure
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            See what your tracked Ethereum wallets expose you to without
            connecting a wallet, signing a message, or handing Calyrn custody.
          </p>
        </section>

        <ExposureContent />

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Calyrn / Exposure</span>
          <span>Tracked wallets · Ethereum Mainnet · Read only</span>
        </footer>
      </main>
    </div>
  );
}
