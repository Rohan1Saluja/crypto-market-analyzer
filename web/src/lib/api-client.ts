const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function getApiBaseUrl() {
  return (process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

async function getErrorMessage(response: Response) {
  try {
    const payload: unknown = await response.json();

    if (
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload
    ) {
      const detail = (payload as { detail?: unknown }).detail;

      if (typeof detail === "string" && detail.trim()) {
        return detail;
      }
    }
  } catch {
    // Fall through to the HTTP status text.
  }

  return response.statusText || "API request failed";
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(
      await getErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as T;
}
