import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import type { SessionUser } from "@kharon/domain";

interface SessionPayload {
  sid: string;
  user_id: string;
  email: string;
  role: SessionUser["role"];
  display_name: string;
  client_id: string;
  technician_id: string;
  exp: number;
}

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

async function sign(input: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createSessionToken(args: {
  user: SessionUser;
  ttlSeconds: number;
  signingKey: string;
}): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload: SessionPayload = {
    sid: crypto.randomUUID(),
    user_id: args.user.user_id,
    email: args.user.email,
    role: args.user.role,
    display_name: args.user.display_name,
    client_id: args.user.client_id,
    technician_id: args.user.technician_id,
    exp: Math.floor(Date.now() / 1_000) + args.ttlSeconds
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${header}.${encodedPayload}`;
  const signature = await sign(unsigned, args.signingKey);
  return `${unsigned}.${signature}`;
}

export async function verifySessionToken(args: {
  token: string;
  signingKeys: string[];
}): Promise<SessionUser | null> {
  const parts = args.token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, providedSignature] = parts as [string, string, string];
  const unsigned = `${header}.${payload}`;

  for (const signingKey of args.signingKeys) {
    try {
      const computedSignature = await sign(unsigned, signingKey);
      if (computedSignature === providedSignature) {
        const parsed = JSON.parse(base64UrlDecode(payload)) as SessionPayload;
        if (parsed.exp <= Math.floor(Date.now() / 1_000)) {
          return null;
        }
        return {
          user_id: parsed.user_id,
          email: parsed.email,
          role: parsed.role,
          display_name: parsed.display_name,
          client_id: parsed.client_id,
          technician_id: parsed.technician_id
        };
      }
    } catch {
      // If parsing fails for one key, continue to next key or return null
      continue;
    }
  }

  return null;
}

export async function setSessionCookie(args: {
  c: Context;
  cookieName: string;
  token: string;
  ttlSeconds: number;
}): Promise<void> {
  setCookie(args.c, args.cookieName, args.token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: args.ttlSeconds
  });
}

export function clearSessionCookie(args: { c: Context; cookieName: string }): void {
  deleteCookie(args.c, args.cookieName, {
    path: "/"
  });
}

export function readSessionCookie(args: { c: Context; cookieName: string }): string {
  return getCookie(args.c, args.cookieName) ?? "";
}
