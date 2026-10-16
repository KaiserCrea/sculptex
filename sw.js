const CACHE = 'sculptex-v8';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-192-v2.png', 'icon-512-v2.png', 'icon-mask-192-v3.png', 'icon-mask-512-v3.png'];

self.addEventListener('install', e => {
  // Chaque fichier est mis en cache séparément : un fichier lent ou absent ne bloque pas les autres.
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// L'appli s'ouvre tout de suite avec la version gardée sur le téléphone,
// puis la mise à jour se télécharge en arrière-plan pour la prochaine ouverture.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const cached = await c.match(key, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    if (cached) { e.waitUntil(net); return cached; }
    const r = await net;
    return r || (await c.match('index.html')) || Response.error();
  }));
});
