import type { NextRequest } from "next/server";

import { fetchAuthenticatedApi, rejectCrossOriginMutation } from "@/lib/calyrn-bff";

type CreateWalletPayload = {
  address: string;
  label: string | null;
};

function parseCreateWalletPayload(value: unknown): CreateWalletPayload | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("address" in value) ||
    typeof (value as { address?: unknown }).address !== "string"
  ) {
    return null;
  }

  const labelValue = (value as { label?: unknown }).label;
  if (
    labelValue !== undefined &&
    labelValue !== null &&
    typeof labelValue !== "string"
  ) {
    return null;
  }

  return {
    address: (value as { address: string }).address,
    label: labelValue ?? null,
  };
}

export async function GET() {
  return fetchAuthenticatedApi("/api/v1/me/wallets");
}

export async function POST(request: NextRequest) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) {
    return rejected;
  }

  let payload: CreateWalletPayload | null = null;

  try {
    payload = parseCreateWalletPayload(await request.json());
  } catch {
    return Response.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload) {
    return Response.json(
      { detail: "A wallet address and optional string label are required" },
      { status: 400 },
    );
  }

  return fetchAuthenticatedApi("/api/v1/me/wallets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}
