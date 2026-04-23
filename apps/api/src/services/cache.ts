/**
 * KharonOps — Caching Service
 * Purpose: Manages KV and memory-based caching with versioning.
 * Dependencies: ../context.js (AppBindings)
 * Structural Role: Infrastructure service for state-coalescing and performance.
 */

import type { AppBindings } from "../context.js";

export type KvLikeNamespace = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

const memoryCache = new Map<string, { expiresAt: number; value: string }>();
let memoryCacheVersion = 1;

export function getKvNamespace(env: AppBindings["Bindings"] | undefined): KvLikeNamespace | null {
  if (!env) return null;
  const candidate = env.KHARON_CACHE as Partial<KvLikeNamespace> | undefined;
  if (candidate && typeof candidate.get === "function" && typeof candidate.put === "function") {
    return candidate as KvLikeNamespace;
  }
  return null;
}

export async function getCacheVersion(env: AppBindings["Bindings"] | undefined): Promise<number> {
  const kv = getKvNamespace(env);
  if (!kv) {
    return memoryCacheVersion;
  }
  try {
    const raw = await kv.get("cache:workspace:version");
    const parsed = Number(raw ?? "1");
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    await kv.put("cache:workspace:version", "1");
    return 1;
  } catch (error) {
    console.error("KV getCacheVersion failed, falling back to memory:", error);
    return memoryCacheVersion;
  }
}

export async function bumpCacheVersion(env: AppBindings["Bindings"] | undefined): Promise<void> {
  const kv = getKvNamespace(env);
  if (!kv) {
    memoryCacheVersion += 1;
    memoryCache.clear();
    return;
  }
  try {
    const current = await getCacheVersion(env);
    await kv.put("cache:workspace:version", String(current + 1));
  } catch (error) {
    console.error("KV bumpCacheVersion failed, falling back to memory:", error);
    memoryCacheVersion += 1;
    memoryCache.clear();
  }
}

export async function getCachedJson<T>(env: AppBindings["Bindings"] | undefined, key: string): Promise<T | null> {
  const kv = getKvNamespace(env);
  if (!kv) {
    const hit = memoryCache.get(key);
    if (!hit || hit.expiresAt < Date.now()) {
      return null;
    }
    try {
      return JSON.parse(hit.value) as T;
    } catch {
      return null;
    }
  }

  try {
    const raw = await kv.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("KV getCachedJson failed:", error);
    return null;
  }
}

export async function putCachedJson<T>(
  env: AppBindings["Bindings"] | undefined,
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const kv = getKvNamespace(env);
  const serialized = JSON.stringify(value);
  if (!kv) {
    memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
    return;
  }

  try {
    // Cloudflare KV put options: expirationTtl must be at least 60 seconds
    const effectiveTtl = Math.max(60, ttlSeconds);
    await kv.put(key, serialized, { expirationTtl: effectiveTtl });
  } catch (error) {
    console.error("KV putCachedJson failed:", error);
    memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
}
