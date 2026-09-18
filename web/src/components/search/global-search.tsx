"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { MarketCoin } from "@/types/market";

function formatPrice(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatChange(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]',
    ),
  );
}

export function GlobalSearch({ coins }: { coins: MarketCoin[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      setOpen(true);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function openAsset(assetId: string) {
    setOpen(false);
    router.push(`/coin/${assetId}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="calyrn-edge flex size-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.022] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-8 sm:w-auto sm:gap-2 sm:px-3"
        aria-label="Search Calyrn"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search Calyrn</span>
        <span className="ml-1 hidden rounded-md border border-white/[0.08] bg-black/10 px-1.5 font-mono text-[9px] text-muted-foreground lg:inline">
          /
        </span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Calyrn"
        description="Search the current market universe and open asset research."
        className="max-w-xl! border border-white/[0.08] bg-[var(--popover)] shadow-2xl"
      >
        <Command className="bg-transparent">
          <CommandInput
            autoFocus
            placeholder="Search Bitcoin, ETH, Solana…"
            aria-label="Search Calyrn assets"
          />

          <CommandList className="max-h-[420px]">
            <CommandEmpty>No assets match that search.</CommandEmpty>

            <CommandGroup heading="Research universe">
              {coins.map((coin) => (
                <CommandItem
                  key={coin.id}
                  value={`${coin.name} ${coin.symbol} ${coin.id}`}
                  onSelect={() => openAsset(coin.id)}
                  className="min-h-12 cursor-pointer px-3 py-2.5"
                >
                  {coin.imageUrl ? (
                    <Image
                      src={coin.imageUrl}
                      alt=""
                      width={28}
                      height={28}
                      className="size-7 rounded-full"
                    />
                  ) : (
                    <span className="flex size-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] font-mono text-[8px] uppercase">
                      {coin.symbol.slice(0, 2)}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">
                      {coin.name}
                    </div>
                    <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                      {coin.symbol}
                      {coin.rank !== null ? ` · #${coin.rank}` : ""}
                    </div>
                  </div>

                  <div className="mr-6 text-right">
                    <div className="number-display text-[10px] text-foreground/85">
                      {formatPrice(coin.price)}
                    </div>
                    <div
                      className={
                        (coin.change24h ?? 0) >= 0
                          ? "signal-positive mt-0.5 font-mono text-[8px]"
                          : "signal-negative mt-0.5 font-mono text-[8px]"
                      }
                    >
                      {formatChange(coin.change24h)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
            <span>{coins.length} assets indexed</span>
            <span>Enter to open research</span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
