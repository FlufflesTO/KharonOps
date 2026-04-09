interface AccessJwtHeader {
  alg?: string;
  typ?: string;
  kid?: string;
}

interface AccessPublicJwk extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
}

interface AccessJwtClaims {
  aud?: string | string[];
  exp?: number;
  iat?: number;
  nbf?: number;
  iss?: string;
  sub?: string;
  [key: string]: unknown;
}

interface AccessJwksResponse {
  keys?: AccessPublicJwk[];
}

interface CachedJwks {
  cacheKey: string;
  keys: AccessPublicJwk[];
  expiresAt: number;
}

interface VerifyAccessJwtArgs {
  token: string;
  audience: string;
  jwksUrl: string;
  jwksJson: string;
  issuer: string;
}

let jwksCache: CachedJwks | null = null;

function base64UrlDecodeToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function decodeJsonPart<T>(part: string): T {
  const decoded = new TextDecoder().decode(base64UrlDecodeToBytes(part));
  return JSON.parse(decoded) as T;
}

function isRsaSigningJwk(jwk: AccessPublicJwk): boolean {
  if (jwk.kty !== "RSA") {
    return false;
  }
  if (typeof jwk.n !== "string" || typeof jwk.e !== "string") {
    return false;
  }
  if (jwk.use && jwk.use !== "sig") {
    return false;
  }
  if (jwk.alg && jwk.alg !== "RS256") {
    return false;
  }
  return true;
}

function parseMaxAgeMs(cacheControl: string): number {
  const match = cacheControl.match(/max-age=(\d+)/i);
  if (!match || !match[1]) {
    return 300_000;
  }
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 300_000;
  }
  return parsed * 1_000;
}

function assertConfigured(args: Pick<VerifyAccessJwtArgs, "audience" | "jwksUrl" | "jwksJson">): void {
  if (args.audience.trim() === "") {
    throw new Error("CF Access verification is enabled but audience is missing");
  }

  const hasJwksUrl = args.jwksUrl.trim() !== "";
  const hasInlineJwks = args.jwksJson.trim() !== "";
  if (!hasJwksUrl && !hasInlineJwks) {
    throw new Error("CF Access verification is enabled but JWKS source is missing");
  }
}

function resolveJwksCacheKey(args: Pick<VerifyAccessJwtArgs, "jwksUrl" | "jwksJson">): string {
  return args.jwksJson.trim() !== "" ? `inline:${args.jwksJson}` : `url:${args.jwksUrl}`;
}

function parseInlineJwks(jwksJson: string): AccessPublicJwk[] {
  let parsed: AccessJwksResponse;
  try {
    parsed = JSON.parse(jwksJson) as AccessJwksResponse;
  } catch (error) {
    throw new Error(`Invalid CF_ACCESS_JWKS_JSON: ${String(error)}`);
  }

  const keys = (parsed.keys ?? []).filter(isRsaSigningJwk);
  if (keys.length === 0) {
    throw new Error("CF_ACCESS_JWKS_JSON did not contain any valid RSA signing keys");
  }
  return keys;
}

async function fetchJwks(jwksUrl: string): Promise<{ keys: AccessPublicJwk[]; maxAgeMs: number }> {
  const response = await fetch(jwksUrl, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load CF Access JWKS: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as AccessJwksResponse;
  const keys = (body.keys ?? []).filter(isRsaSigningJwk);
  if (keys.length === 0) {
    throw new Error("CF Access JWKS endpoint returned no valid RSA signing keys");
  }

  const cacheControl = response.headers.get("cache-control") ?? "";
  return { keys, maxAgeMs: parseMaxAgeMs(cacheControl) };
}

async function loadJwks(args: Pick<VerifyAccessJwtArgs, "jwksUrl" | "jwksJson">): Promise<AccessPublicJwk[]> {
  const cacheKey = resolveJwksCacheKey(args);
  if (jwksCache && jwksCache.cacheKey === cacheKey && Date.now() < jwksCache.expiresAt) {
    return jwksCache.keys;
  }

  if (args.jwksJson.trim() !== "") {
    const keys = parseInlineJwks(args.jwksJson);
    jwksCache = {
      cacheKey,
      keys,
      expiresAt: Date.now() + 300_000
    };
    return keys;
  }

  const fetched = await fetchJwks(args.jwksUrl);
  jwksCache = {
    cacheKey,
    keys: fetched.keys,
    expiresAt: Date.now() + fetched.maxAgeMs
  };
  return fetched.keys;
}

function selectJwk(keys: AccessPublicJwk[], header: AccessJwtHeader): AccessPublicJwk {
  if (header.kid) {
    const matched = keys.find((key) => key.kid === header.kid);
    if (!matched) {
      throw new Error("CF Access token key id is unknown");
    }
    return matched;
  }

  if (keys.length !== 1) {
    throw new Error("CF Access token is missing key id while multiple signing keys are available");
  }
  return keys[0] as AccessPublicJwk;
}

function audienceMatches(actual: string | string[] | undefined, expected: string): boolean {
  if (!actual) {
    return false;
  }
  if (Array.isArray(actual)) {
    return actual.includes(expected);
  }
  return actual === expected;
}

function validateTemporalClaims(claims: AccessJwtClaims): void {
  const now = Math.floor(Date.now() / 1_000);
  if (typeof claims.exp !== "number" || now >= claims.exp) {
    throw new Error("CF Access token has expired");
  }
  if (typeof claims.nbf === "number" && now < claims.nbf) {
    throw new Error("CF Access token is not active yet");
  }
}

function validateClaims(claims: AccessJwtClaims, audience: string, issuer: string): void {
  if (!audienceMatches(claims.aud, audience)) {
    throw new Error("CF Access token audience is invalid");
  }
  if (issuer.trim() !== "" && claims.iss !== issuer) {
    throw new Error("CF Access token issuer is invalid");
  }
  validateTemporalClaims(claims);
}

async function verifySignature(token: string, header: AccessJwtHeader, signature: Uint8Array, jwk: AccessPublicJwk): Promise<void> {
  if ((header.alg ?? "RS256") !== "RS256") {
    throw new Error("Unsupported CF Access token algorithm");
  }

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["verify"]
  );

  const signatureCopy = new Uint8Array(signature.byteLength);
  signatureCopy.set(signature);

  const isValid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publicKey,
    signatureCopy.buffer,
    new TextEncoder().encode(token)
  );

  if (!isValid) {
    throw new Error("CF Access token signature is invalid");
  }
}

export async function verifyAccessJwt(args: VerifyAccessJwtArgs): Promise<AccessJwtClaims> {
  assertConfigured(args);
  const parts = args.token.split(".");
  if (parts.length !== 3) {
    throw new Error("CF Access token format is invalid");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
  const header = decodeJsonPart<AccessJwtHeader>(encodedHeader);
  const claims = decodeJsonPart<AccessJwtClaims>(encodedPayload);
  const signature = base64UrlDecodeToBytes(encodedSignature);

  const keys = await loadJwks(args);
  const selectedKey = selectJwk(keys, header);
  await verifySignature(`${encodedHeader}.${encodedPayload}`, header, signature, selectedKey);
  validateClaims(claims, args.audience, args.issuer);

  return claims;
}
