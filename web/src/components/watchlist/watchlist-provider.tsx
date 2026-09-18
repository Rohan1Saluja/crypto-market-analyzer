"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import type { WatchlistItem } from "@/types/watchlist";

type WatchlistStatus = "loading" | "ready" | "signed-out";

type WatchlistContextValue = {
  status: WatchlistStatus;
  items: readonly WatchlistItem[];
  pending: ReadonlySet<string>;
  watched: ReadonlySet<string>;
  toggle: (assetId: string, assetName: string) => Promise<void>;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

async function getErrorDetail(response: Response) {
  try {
    const payload: unknown = await response.json();

    if (
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof (payload as { detail?: unknown }).detail === "string"
    ) {
      return (payload as { detail: string }).detail;
    }
  } catch {
    // Fall through to the generic message.
  }

  return null;
}

function friendlyWatchError(detail: string | null) {
  if (detail === "A verified email address is required") {
    return "Verify your email address, then sign in again before saving assets.";
  }

  return detail ?? "Calyrn could not update Watch. Please try again.";
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WatchlistStatus>("loading");
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const router = useRouter();

  const watched = useMemo(
    () => new Set(items.map((item) => item.assetId)),
    [items],
  );

  useEffect(() => {
    let active = true;

    async function loadWatchlist() {
      try {
        const response = await fetch("/api/me/watchlist", {
          cache: "no-store",
        });

        if (!active) return;

        if (response.status === 401) {
          setItems([]);
          setStatus("signed-out");
          return;
        }

        if (!response.ok) {
          setStatus("ready");
          toast.error("Watch is temporarily unavailable", {
            description: friendlyWatchError(await getErrorDetail(response)),
          });
          return;
        }

        const nextItems = (await response.json()) as WatchlistItem[];
        if (!active) return;

        setItems(nextItems);
        setStatus("ready");
      } catch {
        if (!active) return;

        setStatus("ready");
        toast.error("Watch is temporarily unavailable", {
          description: "Calyrn could not load your saved assets.",
        });
      }
    }

    void loadWatchlist();

    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback(
    async (assetId: string, assetName: string) => {
      if (status === "signed-out") {
        toast.info("Sign in to use Watch", {
          description: "Your saved assets are private to your Calyrn account.",
        });
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
          setItems([]);
          setStatus("signed-out");
          toast.info("Your session has expired", {
            description: "Sign in again to continue using Watch.",
          });
          router.push("/auth/login");
          return;
        }

        if (!response.ok) {
          toast.error(
            isWatched
              ? `Couldn't remove ${assetName} from Watch`
              : `Couldn't add ${assetName} to Watch`,
            {
              description: friendlyWatchError(await getErrorDetail(response)),
            },
          );
          return;
        }

        if (isWatched) {
          setItems((current) =>
            current.filter((item) => item.assetId !== assetId),
          );
          toast.success(`${assetName} removed from Watch`);
          return;
        }

        const savedItem = (await response.json()) as WatchlistItem;
        setItems((current) => {
          const withoutAsset = current.filter(
            (item) => item.assetId !== assetId,
          );
          return [...withoutAsset, savedItem];
        });
        toast.success(`${assetName} added to Watch`);
      } catch {
        toast.error(
          isWatched
            ? `Couldn't remove ${assetName} from Watch`
            : `Couldn't add ${assetName} to Watch`,
          {
            description: "The request did not reach Calyrn. Please try again.",
          },
        );
      } finally {
        setPending((current) => {
          const next = new Set(current);
          next.delete(assetId);
          return next;
        });
      }
    },
    [pending, router, status, watched],
  );

  const value = useMemo(
    () => ({ status, items, pending, watched, toggle }),
    [items, pending, status, toggle, watched],
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
