import type { ApiEnvelope } from "./types";

const JSON_HEADERS = {
  "content-type": "application/json"
};

export async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body ? JSON_HEADERS : {})
    }
  });

  const contentType = response.headers.get("content-type") ?? "";
  let body: ApiEnvelope<T>;

  if (contentType.includes("application/json")) {
    body = (await response.json()) as ApiEnvelope<T>;
  } else {
    const raw = await response.text();
    const accessHint = raw.includes("cloudflareaccess.com") || raw.toLowerCase().includes("access denied");

    throw {
      data: null,
      error: {
        code: "upstream_non_json",
        message: accessHint
          ? "API is protected by Cloudflare Access challenge for this request."
          : `API returned non-JSON content (status ${response.status}).`
      },
      correlation_id: "",
      row_version: null,
      conflict: null
    } satisfies ApiEnvelope<null>;
  }

  if (!response.ok) {
    throw body;
  }
  return body;
}

export function requireData<T>(result: ApiEnvelope<T>, message: string): T {
  if (result.data == null) {
    throw {
      data: null,
      error: { code: "empty_response", message },
      correlation_id: result.correlation_id ?? "",
      row_version: null,
      conflict: null
    } satisfies ApiEnvelope<null>;
  }

  return result.data;
}
