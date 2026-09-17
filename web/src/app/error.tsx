"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6">
        <h1 className="text-lg font-semibold">Live market data unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The market API could not be reached or its upstream provider is
          temporarily unavailable. No fallback market values are being shown.
        </p>
        <Button className="mt-5" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
