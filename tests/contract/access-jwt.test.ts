import { describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";

function toBase64Url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signAccessToken(args: { privateKey: CryptoKey; audience: string; issuer: string; subject: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1_000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key-1" }));
  const payload = toBase64Url(
    JSON.stringify({
      aud: args.audience,
      iss: args.issuer,
      sub: args.subject,
      iat: now,
      nbf: now - 5,
      exp: now + 300
    })
  );

  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    args.privateKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`;
}

describe("contract: cloudflare access jwt", () => {
  it("rejects requests without a valid access assertion when enabled", async () => {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["sign", "verify"]
    );

    const publicJwk = (await crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey & {
      kid?: string;
      use?: string;
      alg?: string;
    };
    publicJwk.kid = "test-key-1";
    publicJwk.use = "sig";
    publicJwk.alg = "RS256";

    const audience = "audience-test-value";
    const issuer = "https://kharonops-pages.cloudflareaccess.com";
    const token = await signAccessToken({
      privateKey: keyPair.privateKey,
      audience,
      issuer,
      subject: "admin@kharon.co.za"
    });

    const app = createApp({
      KHARON_MODE: "local",
      SESSION_KEYS: "local-test-session-key-11111111111111111,local-test-session-key-22222222222222",
      SESSION_COOKIE_NAME: "kharon_session",
      SESSION_TTL_SECONDS: "28800",
      CF_ACCESS_ENABLED: "true",
      CF_ACCESS_AUD: audience,
      CF_ACCESS_ISSUER: issuer,
      CF_ACCESS_JWKS_JSON: JSON.stringify({ keys: [publicJwk] })
    });

    const missingHeaderResponse = await app.request("/api/v1/auth/logout", { method: "POST" });
    expect(missingHeaderResponse.status).toBe(401);

    const invalidHeaderResponse = await app.request("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        "Cf-Access-Jwt-Assertion": "bad.token.value"
      }
    });
    expect(invalidHeaderResponse.status).toBe(401);

    const validHeaderResponse = await app.request("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        "Cf-Access-Jwt-Assertion": token
      }
    });

    expect(validHeaderResponse.status).toBe(200);
  });
});
