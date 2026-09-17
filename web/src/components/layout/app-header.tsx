import Link from "next/link";
import { BarChart3, Bookmark, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = ["Markets", "Watchlist", "Research"];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-[1480px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <BarChart3 className="size-4" />
          </span>
          <span className="hidden text-sm sm:inline">Crypto Market Analyzer</span>
          <span className="text-sm sm:hidden">CMA</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map((item, index) => (
            <span
              key={item}
              className={
                index === 0
                  ? "rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground"
                  : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground"
              }
            >
              {item}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" className="hidden gap-2 sm:flex">
            <Search className="size-3.5" />
            Search
            <span className="ml-2 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              /
            </span>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Open watchlist">
            <Bookmark className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
