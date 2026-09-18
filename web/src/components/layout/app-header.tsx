import Link from "next/link";
import { Bookmark, LogIn, LogOut, Sparkles } from "lucide-react";

import { CalyrnMark } from "@/components/brand/calyrn-mark";
import { PrimaryNav } from "@/components/layout/primary-nav";
import { GlobalSearch } from "@/components/search/global-search";
import { Button } from "@/components/ui/button";
import { auth0 } from "@/lib/auth0";
import { marketService } from "@/services/market.service";
import type { MarketCoin } from "@/types/market";

export async function AppHeader({ coins }: { coins?: MarketCoin[] }) {
  const [session, searchCoins] = await Promise.all([
    auth0.getSession(),
    coins ? Promise.resolve(coins) : marketService.getMarkets(),
  ]);
  const accountLabel = session?.user.name ?? session?.user.email ?? "Account";

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="calyrn-panel mx-auto flex h-14 w-full max-w-[1480px] items-center gap-4 rounded-2xl px-3 sm:px-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label="Calyrn home"
        >
          <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-[10px] border border-white/[0.09] bg-[var(--calyrn-jade)]/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <CalyrnMark className="size-6 text-[var(--calyrn-jade)] transition-transform duration-500 group-hover:scale-[1.06]" />
          </span>

          <span className="hidden sm:block">
            <span className="block font-heading text-sm font-semibold tracking-[-0.025em]">
              Calyrn
            </span>
            <span className="data-label block text-[8px]! leading-3! tracking-[0.08em]!">
              Personal crypto intelligence
            </span>
          </span>
        </Link>

        <PrimaryNav />

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 pr-1 lg:flex">
            <span className="status-orb size-1.5 rounded-full bg-[var(--positive)]" />
            <span className="data-label text-[9px]! tracking-[0.08em]!">
              Market layer live
            </span>
          </div>

          <GlobalSearch coins={searchCoins} />

          <Link
            href="/watch"
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Open Watch"
          >
            <Bookmark className="size-4" />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            disabled
            title="Brief arrives with Signals"
            className="size-8 rounded-xl text-[var(--calyrn-ice)]"
            aria-label="Calyrn Brief coming with Signals"
          >
            <Sparkles className="size-4" />
          </Button>

          {session ? (
            <a
              href="/auth/logout"
              className="hidden h-8 max-w-36 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-2.5 text-[10px] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground sm:flex"
              title={`Signed in as ${accountLabel}`}
            >
              <LogOut className="size-3.5" />
              <span className="truncate">{accountLabel}</span>
            </a>
          ) : (
            <a
              href="/auth/login"
              className="flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-2.5 text-[10px] text-foreground transition-colors hover:bg-white/[0.07]"
            >
              <LogIn className="size-3.5" />
              <span>Sign in</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
