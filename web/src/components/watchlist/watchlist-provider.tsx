"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { WatchlistItem } from "@/types/watchlist";
import { useRouter } from "next/navigation";

type WatchlistStatus = "loading" | "ready" | "signed-out";

type WatchlistContextValue = {
  status: WatchlistStatus;
  pending: ReadonlySet<string>;
  watched: ReadonlySet<string>;
  toggle: (assetId: string) => Promise<void>;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WatchlistStatus>("loading");
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  const router = useRouter();

  useEffect(() => {
    let active = true;

    void fetch("/api/me/watchlist", { cache: "no-store" }).then(
      async (response) => {
        if (!active) return;

        if (response.status === 401) {
          setStatus("signed-out");
          return;
        }

        if (!response.ok) {
          setStatus("ready");
          return;
        }

        const items = (await response.json()) as WatchlistItem[];
        setWatched(new Set(items.map((item) => item.assetId)));
        setStatus("ready");
      },
    );

    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback(
    async (assetId: string) => {
      if (status === "signed-out") {
        router.push("/auth/login");
        return;
      }
      if (status !== "ready" || pending.has(assetId)) {
        return;
      }

      const isWatched = watched.has(assetId);
      setPending((current) => new Set(current).add(assetId));

      try {
        const response = await fetch(
          `/api/me/watchlist/${encodeURIComponent(assetId)}`,
          {
            method: isWatched ? "DELETE" : "PUT",
            headers: isWatched
              ? undefined
              : { "content-type": "application/json" },
            body: isWatched ? undefined : JSON.stringify({ thesis: null }),
          },
        );

        if (response.status === 401) {
          setStatus("signed-out");
          router.push("/auth/login");
          return;
        }
        if (!response.ok) {
          return;
        }

        setWatched((current) => {
          const next = new Set(current);
          if (isWatched) next.delete(assetId);
          else next.add(assetId);
          return next;
        });
      } finally {
        setPending((current) => {
          const next = new Set(current);
          next.delete(assetId);
          return next;
        });
      }
    },
    [pending, status, watched, router],
  );

  const value = useMemo(
    () => ({ status, pending, watched, toggle }),
    [pending, status, toggle, watched],
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used inside WatchlistProvider");
  }
  return context;
}
