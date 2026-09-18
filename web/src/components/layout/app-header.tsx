import Link from "next/link";
import { Bookmark, LogIn, LogOut, Search, Sparkles } from "lucide-react";

import { CalyrnMark } from "@/components/brand/calyrn-mark";
import { Button } from "@/components/ui/button";
import { auth0 } from "@/lib/auth0";

const navItems = ["Markets", "Research", "Exposure", "Signals"];

export async function AppHeader() {
  const session = await auth0.getSession();
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

        <nav
          className="hidden items-center rounded-xl border border-white/[0.06] bg-white/[0.022] p-1 md:flex"
          aria-label="Primary navigation"
        >
          {navItems.map((item, index) => (
            <span
              key={item}
              className={
                index === 0
                  ? "rounded-lg bg-white/[0.075] px-3 py-1.5 text-[11px] font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
              Market layer live
            </span>
          </div>

          <Button
            variant="outline"
            className="calyrn-edge hidden h-8 gap-2 rounded-xl border-white/[0.08] bg-white/[0.022] px-3 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground sm:flex"
          >
            <Search className="size-3.5" />
            <span>Search Calyrn</span>
            <span className="ml-2 rounded-md border border-white/[0.08] bg-black/10 px-1.5 font-mono text-[9px] text-muted-foreground">
              /
            </span>
          </Button>

          <Link
            href="/watch"
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            aria-label="Open Watch"
          >
            <Bookmark className="size-4" />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl text-[var(--calyrn-ice)] hover:bg-white/[0.05]"
            aria-label="Open Calyrn brief"
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
