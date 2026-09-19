import type { NextRequest } from "next/server";

import { fetchAuthenticatedApi, rejectCrossOriginMutation } from "@/lib/calyrn-bff";

type RouteContext = {
  params: Promise<{ walletId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) {
    return rejected;
  }

  const { walletId } = await context.params;

  return fetchAuthenticatedApi(
    `/api/v1/me/wallets/${encodeURIComponent(walletId)}/refresh`,
    { method: "POST" },
  );
}
