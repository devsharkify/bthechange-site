// =============================================================================
// B The Change · Service Worker
// Strategy: stale-while-revalidate for assets, network-first for pages
// =============================================================================

const VERSION = 'btc-v1.0.0';
const CACHE_STATIC = `${VERSION}-static`;
const CACHE_PAGES = `${VERSION}-pages`;
const CACHE_IMAGES = `${VERSION}-images`;

// Critical assets to pre-cache on install (the app shell)
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/team.html',
  '/awards.html',
  '/programs/',
  '/assets/style.css',
  '/assets/bthechange-logo.png',
  '/manifest.json',
  '/offline.html',
];

// =============================================================================
// INSTALL: pre-cache the shell
// =============================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Some shell assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// =============================================================================
// ACTIVATE: clean up old caches
// =============================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !key.startsWith(VERSION))
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// =============================================================================
// FETCH: route to right strategy
// =============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin (Supabase etc), and Chrome extensions
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/chrome-extension')) return;

  // Skip Supabase, hCaptcha, analytics
  if (url.hostname.includes('supabase') ||
      url.hostname.includes('hcaptcha') ||
      url.hostname.includes('plausible') ||
      url.hostname.includes('cdn.jsdelivr') ||
      url.hostname.includes('fonts.googleapis') ||
      url.hostname.includes('fonts.gstatic')) {
    return;
  }

  // Images: stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, CACHE_IMAGES));
    return;
  }

  // CSS/JS: stale-while-revalidate
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
    return;
  }

  // HTML pages: network-first, falling back to cache, falling back to offline page
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
});

// =============================================================================
// CACHING STRATEGIES
// =============================================================================

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchAndCache = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || fetchAndCache || new Response('', { status: 504 });
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Last resort: the offline page
    const offline = await caches.match('/offline.html');
    if (offline) return offline;

    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// =============================================================================
// MESSAGES (for "skip waiting" updates from the page)
// =============================================================================
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
