import type { NextRequest } from "next/server";

import { fetchAuthenticatedApi, rejectCrossOriginMutation } from "@/lib/calyrn-bff";

type RouteContext = {
  params: Promise<{ assetId: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) {
    return rejected;
  }

  const { assetId } = await context.params;
  let thesis: string | null = null;

  try {
    const payload: unknown = await request.json();
    if (
      typeof payload === "object" &&
      payload !== null &&
      "thesis" in payload &&
      (typeof (payload as { thesis?: unknown }).thesis === "string" ||
        (payload as { thesis?: unknown }).thesis === null)
    ) {
      thesis = (payload as { thesis: string | null }).thesis;
    }
  } catch {
    // A star-only watchlist mutation has no required body fields.
  }

  return fetchAuthenticatedApi(
    `/api/v1/me/watchlist/${encodeURIComponent(assetId)}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ thesis }),
    },
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) {
    return rejected;
  }

  const { assetId } = await context.params;
  return fetchAuthenticatedApi(
    `/api/v1/me/watchlist/${encodeURIComponent(assetId)}`,
    { method: "DELETE" },
  );
}
