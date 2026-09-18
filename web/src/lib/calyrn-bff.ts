import "server-only";

import type { NextRequest } from "next/server";

import { auth0 } from "@/lib/auth0";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function apiBaseUrl() {
  return (process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

export function rejectCrossOriginMutation(request: NextRequest): Response | null {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return Response.json({ detail: "Cross-origin mutation rejected" }, { status: 403 });
  }

  return null;
}

export async function fetchAuthenticatedApi(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ detail: "Authentication required" }, { status: 401 });
  }

  const { token } = await auth0.getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  headers.set("accept", "application/json");

  return fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
