// FocusWord Service Worker — caches the app shell for offline use.
const CACHE = 'focusword-v1';
const SHELL = ['index.html', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never cache Bible API or AI calls — always go to network.
  if (url.includes('bible-api.com') || url.includes('generativelanguage') || url.includes('youtube')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      // Cache app shell + fonts as we go.
      if (e.request.method === 'GET' && (url.includes('index.html') || url.includes('fonts.g'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
