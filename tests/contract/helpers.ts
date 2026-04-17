import { createApp } from "../../apps/api/src/index";
import { createSessionToken } from "../../apps/api/src/auth/session";
import type { SessionUser } from "@kharon/domain";

export const testEnv = {
  KHARON_MODE: "local",
  SESSION_KEYS: "local-test-session-key-11111111111111111,local-test-session-key-22222222222222",
  SESSION_COOKIE_NAME: "kharon_session",
  SESSION_TTL_SECONDS: "28800"
};

export function makeTestApp() {
  return createApp(testEnv);
}

export async function loginAs(app: ReturnType<typeof makeTestApp>, token: string): Promise<string> {
  const response = await app.request("/api/v1/auth/google-login", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ id_token: token })
  });

  const cookie = response.headers.get("set-cookie") ?? "";
  if (!cookie) {
    throw new Error("No session cookie received");
  }

  return cookie.split(";")[0] ?? "";
}

export async function issueSessionCookie(user: SessionUser): Promise<string> {
  const signingKey = testEnv.SESSION_KEYS.split(",")[0];
  if (!signingKey) {
    throw new Error("Missing test signing key");
  }

  const token = await createSessionToken({
    user,
    ttlSeconds: Number(testEnv.SESSION_TTL_SECONDS),
    signingKey
  });

  return `${testEnv.SESSION_COOKIE_NAME}=${token}`;
}
