import Link from "next/link";
import { Bookmark, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = ["Markets", "Watchlist", "Research"];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="spectral-panel mx-auto flex h-14 w-full max-w-[1480px] items-center gap-4 rounded-2xl px-3 sm:px-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label="CMA home"
        >
          <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <span className="absolute inset-[5px] rounded-[6px] bg-[conic-gradient(from_205deg,var(--spectral-violet),var(--spectral-glacier),var(--spectral-peach),var(--spectral-violet))] opacity-85 blur-[0.2px] transition-transform duration-500 group-hover:rotate-12" />
            <span className="relative font-heading text-[10px] font-semibold tracking-[-0.08em] text-[#100f16]">
              C
            </span>
          </span>

          <span className="hidden sm:block">
            <span className="block font-heading text-sm font-semibold tracking-[-0.025em]">
              CMA
            </span>
            <span className="data-label block text-[8px]! leading-3! tracking-[0.08em]!">
              Market intelligence
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center rounded-xl border border-white/[0.06] bg-white/[0.025] p-1 md:flex"
          aria-label="Primary navigation"
        >
          {navItems.map((item, index) => (
            <span
              key={item}
              className={
                index === 0
                  ? "rounded-lg bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {item}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 pr-1 lg:flex">
            <span className="status-orb size-1.5 rounded-full bg-[var(--positive)]" />
            <span className="data-label text-[9px]! tracking-[0.08em]!">
              Live feed
            </span>
          </div>

          <Button
            variant="outline"
            className="spectral-edge hidden h-8 gap-2 rounded-xl border-white/[0.08] bg-white/[0.025] px-3 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground sm:flex"
          >
            <Search className="size-3.5" />
            <span>Search markets</span>
            <span className="ml-2 rounded-md border border-white/[0.08] bg-black/10 px-1.5 font-mono text-[9px] text-muted-foreground">
              /
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Open watchlist"
          >
            <Bookmark className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl text-[var(--spectral-glacier)] hover:bg-white/[0.06]"
            aria-label="Research assistant"
          >
            <Sparkles className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
