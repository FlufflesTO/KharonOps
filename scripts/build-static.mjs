import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const outputRoot = resolve(root, "dist/public");
const siteDist = resolve(root, "apps/site/dist");
const portalDist = resolve(root, "apps/portal/dist");
const defaultWorkerOrigin = "https://kharon-unified-api-public.connor-venter.workers.dev";

function normalizeOrigin(value) {
  const raw = String(value ?? "").trim();
  if (raw === "") {
    return defaultWorkerOrigin;
  }

  const url = new URL(raw);
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function envFlag(name, fallback = false) {
  const value = String(process.env[name] ?? "").trim().toLowerCase();
  if (value === "") {
    return fallback;
  }
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function envText(name, fallback) {
  const value = String(process.env[name] ?? "").trim();
  return value === "" ? fallback : value;
}

function buildHeaders(workerOrigin) {
  const cspHeaderName = envFlag("NETLIFY_CSP_REPORT_ONLY", false)
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";
  const hstsEnabled = envFlag("NETLIFY_ENABLE_HSTS", true);
  const globalNoindex = envFlag("NETLIFY_GLOBAL_NOINDEX", false);
  const portalNoindex = envFlag("NETLIFY_PORTAL_NOINDEX", true);

  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "script-src 'self'",
    `connect-src 'self' ${workerOrigin}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "upgrade-insecure-requests"
  ].join("; ");

  const globalHeaderLines = [
    "/*",
    "  X-Frame-Options: DENY",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()",
    "  Cross-Origin-Resource-Policy: same-origin",
    `  ${cspHeaderName}: ${contentSecurityPolicy}`
  ];

  if (hstsEnabled) {
    globalHeaderLines.push("  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload");
  }

  if (globalNoindex) {
    globalHeaderLines.push("  X-Robots-Tag: noindex, nofollow, noarchive");
  }

  const sections = [
    globalHeaderLines.join("\n"),
    [
      "/",
      `  Cache-Control: ${envText("NETLIFY_SITE_CACHE_CONTROL", "public, max-age=0, must-revalidate")}`
    ].join("\n"),
    [
      "/index.html",
      `  Cache-Control: ${envText("NETLIFY_SITE_CACHE_CONTROL", "public, max-age=0, must-revalidate")}`
    ].join("\n"),
    [
      "/assets/*",
      `  Cache-Control: ${envText("NETLIFY_STATIC_ASSET_CACHE_CONTROL", "public, max-age=31536000, immutable")}`
    ].join("\n"),
    [
      "/portal/",
      `  Cache-Control: ${envText("NETLIFY_PORTAL_INDEX_CACHE_CONTROL", "no-store")}`,
      ...(portalNoindex ? ["  X-Robots-Tag: noindex, nofollow, noarchive"] : [])
    ].join("\n"),
    [
      "/portal/index.html",
      `  Cache-Control: ${envText("NETLIFY_PORTAL_INDEX_CACHE_CONTROL", "no-store")}`,
      ...(portalNoindex ? ["  X-Robots-Tag: noindex, nofollow, noarchive"] : [])
    ].join("\n"),
    [
      "/portal/assets/*",
      `  Cache-Control: ${envText("NETLIFY_STATIC_ASSET_CACHE_CONTROL", "public, max-age=31536000, immutable")}`
    ].join("\n"),
    [
      "/portal/sw.js",
      `  Cache-Control: ${envText("NETLIFY_PORTAL_SW_CACHE_CONTROL", "public, max-age=0, must-revalidate")}`
    ].join("\n"),
    [
      "/portal/manifest.webmanifest",
      `  Cache-Control: ${envText("NETLIFY_PORTAL_MANIFEST_CACHE_CONTROL", "public, max-age=3600")}`
    ].join("\n")
  ];

  return `${sections.join("\n\n")}\n`;
}

function buildRedirects(workerOrigin) {
  return ["/portal /portal/ 301!", `/api/* ${workerOrigin}/api/:splat 200`].join("\n") + "\n";
}

if (existsSync(outputRoot)) {
  rmSync(outputRoot, { recursive: true, force: true });
}
mkdirSync(outputRoot, { recursive: true });

if (!existsSync(siteDist)) {
  throw new Error("apps/site/dist does not exist. Run site build first.");
}

if (!existsSync(portalDist)) {
  throw new Error("apps/portal/dist does not exist. Run portal build first.");
}

cpSync(siteDist, outputRoot, { recursive: true });
cpSync(portalDist, resolve(outputRoot, "portal"), { recursive: true });

const workerOrigin = normalizeOrigin(process.env.NETLIFY_WORKER_ORIGIN ?? process.env.WORKER_PUBLIC_URL);
writeFileSync(resolve(outputRoot, "_headers"), buildHeaders(workerOrigin), "utf8");
writeFileSync(resolve(outputRoot, "_redirects"), buildRedirects(workerOrigin), "utf8");

console.log(`Static bundle assembled at dist/public using API origin ${workerOrigin}`);
