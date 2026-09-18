import { fetchAuthenticatedApi } from "@/lib/calyrn-bff";

export async function GET() {
  return fetchAuthenticatedApi("/api/v1/me");
}
