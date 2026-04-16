import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const outputRoot = resolve(root, "dist/public");
const siteDist = resolve(root, "apps/site/dist");
const portalDist = resolve(root, "apps/portal/dist");
const workersDevNoindexPattern = String(process.env.WORKERS_DEV_NOINDEX_PATTERN ?? "https://:worker.kharonops.workers.dev/*").trim();

function buildHeaders() {
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://accounts.google.com/gsi/",
    "form-action 'self'",
    "object-src 'none'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
    "font-src 'self' https://fonts.gstatic.com",
    "script-src 'self' https://accounts.google.com/gsi/client https://static.cloudflareinsights.com",
    "connect-src 'self' https://accounts.google.com/gsi/ https://cloudflareinsights.com https://static.cloudflareinsights.com",
    "manifest-src 'self'",
    "worker-src 'self'",
    "upgrade-insecure-requests"
  ].join("; ");

  const sections = [
    [
      "/*",
      "  X-Frame-Options: DENY",
      "  X-Content-Type-Options: nosniff",
      "  Referrer-Policy: strict-origin-when-cross-origin",
      "  Cross-Origin-Opener-Policy: same-origin-allow-popups",
      "  Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()",
      "  Cross-Origin-Resource-Policy: same-origin",
      "  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
      `  Content-Security-Policy: ${contentSecurityPolicy}`
    ].join("\n"),
    [
      "/portal",
      "  Cache-Control: no-store",
      "  X-Robots-Tag: noindex, nofollow, noarchive"
    ].join("\n"),
    [
      "/",
      "  Cache-Control: public, max-age=0, must-revalidate"
    ].join("\n"),
    [
      "/index.html",
      "  Cache-Control: public, max-age=0, must-revalidate"
    ].join("\n"),
    [
      "/assets/*",
      "  Cache-Control: public, max-age=31536000, immutable"
    ].join("\n"),
    [
      "/portal/",
      "  Cache-Control: no-store",
      "  X-Robots-Tag: noindex, nofollow, noarchive"
    ].join("\n"),
    [
      "/portal/index.html",
      "  Cache-Control: no-store",
      "  X-Robots-Tag: noindex, nofollow, noarchive"
    ].join("\n"),
    [
      "/portal/assets/*",
      "  Cache-Control: public, max-age=31536000, immutable"
    ].join("\n"),
    [
      "/portal/sw.js",
      "  Cache-Control: public, max-age=0, must-revalidate"
    ].join("\n"),
    [
      "/portal/manifest.webmanifest",
      "  Cache-Control: public, max-age=3600"
    ].join("\n")
  ];

  if (workersDevNoindexPattern !== "") {
    sections.push(
      [
        workersDevNoindexPattern,
        "  X-Robots-Tag: noindex, nofollow, noarchive"
      ].join("\n")
    );
  }

  return `${sections.join("\n\n")}\n`;
}

function buildRedirects() {
  return "/portal /portal/ 301\n";
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

writeFileSync(resolve(outputRoot, "_headers"), buildHeaders(), "utf8");
writeFileSync(resolve(outputRoot, "_redirects"), buildRedirects(), "utf8");

console.log("Static bundle assembled at dist/public for Cloudflare static assets.");
