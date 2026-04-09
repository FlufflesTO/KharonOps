import { executeWithRetry } from "./retry.js";
import { GoogleAdapterError, isTransientGoogleError, mapGoogleHttpError } from "./errors.js";
import { signJwt } from "./jwt.js";
import type { GoogleRuntimeConfig } from "./types.js";

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

const tokenCache = new Map<string, CachedToken>();

function encodeForm(params: Record<string, string>): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    body.set(key, value);
  }
  return body.toString();
}

function scopesKey(scopes: string[]): string {
  return scopes.slice().sort().join(" ");
}

export async function getServiceAccessToken(config: GoogleRuntimeConfig, scopes: string[]): Promise<string> {
  const cacheKey = `${config.serviceAccountEmail}|${scopesKey(scopes)}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAtMs > Date.now() + 60_000) {
    return cached.accessToken;
  }

  if (!config.serviceAccountEmail || !config.serviceAccountPrivateKey) {
    throw new GoogleAdapterError({
      message: "Missing Google service account credentials",
      code: "google_config_error",
      service: "auth",
      transient: false
    });
  }

  const now = Math.floor(Date.now() / 1_000);
  const assertion = await signJwt(
    {
      iss: config.serviceAccountEmail,
      scope: scopes.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3_300
    },
    config.serviceAccountPrivateKey
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: encodeForm({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  const body = await response.json();
  if (!response.ok) {
    throw mapGoogleHttpError("auth", response.status, body);
  }

  const accessToken = String(body.access_token ?? "");
  const expiresIn = Number(body.expires_in ?? 3_300);
  if (!accessToken) {
    throw new GoogleAdapterError({
      message: "Google token response missing access_token",
      code: "google_auth_error",
      service: "auth",
      transient: false,
      status: 500,
      details: { response: body }
    });
  }

  tokenCache.set(cacheKey, {
    accessToken,
    expiresAtMs: Date.now() + expiresIn * 1_000
  });

  return accessToken;
}

export async function googleApiRequest<T>(args: {
  config: GoogleRuntimeConfig;
  service: string;
  url: string;
  method?: string;
  scopes: string[];
  headers?: Record<string, string>;
  body?: BodyInit | null;
  parse?: "json" | "text" | "arrayBuffer";
}): Promise<T> {
  const parse = args.parse ?? "json";

  return executeWithRetry<T>(
    async () => {
      const accessToken = await getServiceAccessToken(args.config, args.scopes);
      const response = await fetch(args.url, {
        method: args.method ?? "GET",
        headers: {
          authorization: `Bearer ${accessToken}`,
          ...(args.headers ?? {})
        },
        body: args.body ?? null
      });

      if (!response.ok) {
        let parsedError: unknown;
        try {
          parsedError = await response.json();
        } catch {
          parsedError = await response.text();
        }
        throw mapGoogleHttpError(args.service, response.status, parsedError);
      }

      if (parse === "text") {
        return (await response.text()) as T;
      }
      if (parse === "arrayBuffer") {
        return (await response.arrayBuffer()) as T;
      }
      return (await response.json()) as T;
    },
    {
      maxAttempts: 4,
      baseDelayMs: 250,
      maxDelayMs: 2_000,
      shouldRetry: (error) => isTransientGoogleError(error)
    }
  );
}
