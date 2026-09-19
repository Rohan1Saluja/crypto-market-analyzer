import type { NextRequest } from "next/server";

import { coinService } from "@/services/coin.service";
import type { PriceHistoryRange } from "@/types/coin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ranges = new Set<PriceHistoryRange>(["24h", "7d", "30d"]);

function parseRange(value: string | null): PriceHistoryRange | null {
  return value !== null && ranges.has(value as PriceHistoryRange)
    ? (value as PriceHistoryRange)
    : null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const range = parseRange(request.nextUrl.searchParams.get("range"));

  if (!range) {
    return Response.json(
      { detail: "range must be one of: 24h, 7d, 30d" },
      { status: 422 },
    );
  }

  const { id } = await context.params;
  const history = await coinService.getPriceHistory(id, range);

  if (!history) {
    return Response.json({ detail: `Unknown coin: ${id}` }, { status: 404 });
  }

  return Response.json(history);
}
