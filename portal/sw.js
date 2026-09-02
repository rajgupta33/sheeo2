const CACHE_NAME = 'sheeo-portal-v2';
const APP_SHELL = [
  '/portal/',
  '/portal/index.html',
  '/portal/login.html',
  '/portal/reset-password.html',
  '/portal/membership-status.html',
  '/portal/dashboard.html',
  '/portal/points.html',
  '/portal/earn-points.html',
  '/portal/directory.html',
  '/portal/member-profile.html',
  '/portal/profile.html',
  '/portal/refer.html',
  '/portal/rewards.html',
  '/portal/membership.html',
  '/portal/manifest.webmanifest',
  '/portal/icon.svg',
  '/sh-logo.jpeg',
  '/assets/css/portal.css',
  '/assets/css/admin.css',
  '/assets/js/config.js',
  '/assets/js/portal-boot.js',
  '/assets/js/supabase-client.js',
  '/assets/js/utils.js',
  '/assets/js/api.js',
  '/assets/js/auth.js',
  '/assets/js/auth-page.js',
  '/assets/js/route-guard.js',
  '/assets/js/portal-shell.js',
  '/assets/js/dashboard.js',
  '/assets/js/points.js',
  '/assets/js/claims.js',
  '/assets/js/directory.js',
  '/assets/js/profile.js',
  '/assets/js/referrals.js',
  '/assets/js/rewards.js',
  '/assets/js/membership.js',
  '/assets/js/admin.js',
  '/assets/js/mock-data.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (
          (await caches.match(request, { ignoreSearch: true })) ||
          (await caches.match('/portal/login.html'))
        ))
    );
    return;
  }

  // Code assets must never be served stale: a member on an old bundle after a
  // deploy sees a broken portal. Network first, cache only as an offline fallback.
  const isCode = /\.(?:js|css|webmanifest)$/i.test(url.pathname);

  if (isCode) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Images, fonts and other static media: cache first, refreshed in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
