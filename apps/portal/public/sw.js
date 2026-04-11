const CACHE_NAME = "kharon-portal-v5";
const STATIC_ASSETS = [
  "/portal/manifest.webmanifest"
];

function offlineFallbackResponse() {
  return new Response("Portal is temporarily offline. Retry shortly.", {
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
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
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

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  const isPortalNavigation =
    request.mode === "navigate" &&
    (url.pathname === "/portal" || url.pathname === "/portal/" || url.pathname === "/portal/index.html");

  if (isPortalNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put("/portal/index.html", copy).catch(() => undefined);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request, { ignoreSearch: true })) ??
            (await caches.match("/portal/")) ??
            (await caches.match("/portal/index.html"));
          return cached ?? offlineFallbackResponse();
        })
    );
  }
});
