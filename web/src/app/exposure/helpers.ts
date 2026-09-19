import { ExposureLoadResult, ExposureReadModel } from "@/types/exposure";

export async function getErrorDetail(response: Response) {
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

export async function fetchExposureSnapshot(): Promise<ExposureLoadResult> {
  try {
    const response = await fetch("/api/me/exposure", {
      cache: "no-store",
    });

    if (response.status === 401) {
      return { status: "signed-out" };
    }

    if (!response.ok) {
      return {
        status: "error",
        message:
          (await getErrorDetail(response)) ??
          "Calyrn could not load your exposure right now.",
      };
    }

    return {
      status: "ready",
      exposure: (await response.json()) as ExposureReadModel,
    };
  } catch {
    return {
      status: "error",
      message: "The request did not reach Calyrn. Please try again.",
    };
  }
}
