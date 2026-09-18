"use client";

import { Star } from "lucide-react";

import { useWatchlist } from "@/components/watchlist/watchlist-provider";

export function WatchlistStar({
  assetId,
  assetName,
  size = "compact",
}: {
  assetId: string;
  assetName: string;
  size?: "compact" | "detail";
}) {
  const { pending, status, toggle, watched } = useWatchlist();
  const isWatched = watched.has(assetId);
  const isPending = pending.has(assetId);
  const disabled = status === "loading" || isPending;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void toggle(assetId, assetName)}
      aria-pressed={isWatched}
      aria-label={`${isWatched ? "Remove" : "Add"} ${assetName} ${
        isWatched ? "from" : "to"
      } watchlist`}
      className={
        size === "detail"
          ? "flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-muted-foreground transition-all hover:scale-105 hover:bg-white/[0.06] hover:text-[var(--spectral-peach)] active:scale-95 disabled:cursor-wait disabled:opacity-50"
          : "rounded-md text-muted-foreground/55 transition-all duration-200 hover:scale-110 hover:text-[var(--spectral-peach)] active:scale-90 disabled:cursor-wait disabled:opacity-40"
      }
    >
      <Star
        className={`${size === "detail" ? "size-4" : "size-3.5"} ${
          isWatched ? "fill-current text-[var(--spectral-peach)]" : ""
        }`}
      />
    </button>
  );
}
