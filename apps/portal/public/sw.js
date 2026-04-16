const CACHE_NAME = "kharon-portal-v6";
const STATIC_ASSETS = ["/portal/manifest.webmanifest"];

function offlineFallbackResponse() {
  return new Response("Portal is temporarily offline or signal is unavailable. The local queue remains active.", {
    status: 503,
    statusText: "Service Unavailable",
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache API calls in the SW (handled by application-level OfflineQueue)
  if (url.pathname.includes("/api/")) {
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  const isPortalNavigation =
    request.mode === "navigate" && (url.pathname === "/portal" || url.pathname === "/portal/" || url.pathname === "/portal/index.html");

  const isAsset = url.pathname.includes("/assets/");

  if (isPortalNavigation || isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Map all navigation attempts to /portal/index.html to ensure SPA works offline
              const cacheKey = isPortalNavigation ? "/portal/index.html" : request;
              cache.put(cacheKey, copy).catch(() => undefined);
            });
          }
          return response;
        });

        // Cache-First for assets, Stale-While-Revalidate for navigation
        if (isAsset && cached) {
          return cached;
        }

        return cached || fetchPromise;
      }).catch(() => caches.match("/portal/index.html").then((fallback) => fallback || offlineFallbackResponse()))
    );
  }
});
