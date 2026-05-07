const STATIC_CACHE = "waypoint-static-v1";
const TILE_CACHE = "waypoint-tiles-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([
        OFFLINE_URL,
        "/manifest.json",
        "/icons/icon.svg",
        "/icons/maskable.svg"
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("waypoint-") && ![STATIC_CACHE, TILE_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/api/auth/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || request.destination === "script" || request.destination === "style") {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.destination === "image" && isMapTileHost(url.hostname)) {
    event.respondWith(networkFirstRespectingHeaders(request, TILE_CACHE));
    return;
  }
});

function isMapTileHost(hostname) {
  return hostname === "tile.openstreetmap.org" || hostname.endsWith(".tile.openstreetmap.org");
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstRespectingHeaders(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    const cacheControl = response.headers.get("cache-control") || "";
    if (response.ok && !cacheControl.includes("no-store") && !cacheControl.includes("private")) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw new Error("Tile unavailable.");
  }
}
