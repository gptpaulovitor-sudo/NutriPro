// ═══════════════════════════════════════════════════════════
// NutriAx Disciplina — Service Worker Exclusivo do Paciente
// Escopo: /disciplina/ | Cache: nutriax-disciplina-v1.0.0
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = 'nutriax-disciplina-v1.0.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
  '../firebase-service.js',
  '../fasting-module.js',
  '../assets/patient/discipline-hero.jpg',
  '../assets/patient/training-hero.jpg',
  '../assets/patient/nutrition-hero.jpg',
  '../assets/patient/fasting-hero.jpg',
  '../assets/patient/hydration-hero.jpg',
  '../assets/patient/sleep-hero.jpg',
  '../assets/patient/evolution-hero.jpg'
];

// 1. Instalação: Pré-cache restrito aos recursos do Disciplina
self.addEventListener('install', (event) => {
  console.log('[NutriAx Disciplina SW] Instalando Service Worker e cacheando recursos do paciente...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.warn(`[NutriAx Disciplina SW] Falha ao baixar: ${url} (Status: ${response.status})`);
            })
            .catch((err) => {
              console.warn(`[NutriAx Disciplina SW] Erro ao buscar: ${url}`, err);
            })
        )
      );
    }).then(() => {
      console.log('[NutriAx Disciplina SW] Pré-cache do paciente concluído.');
      return self.skipWaiting();
    })
  );
});

// 2. Ativação: Limpeza seletiva — NUNCA toca em nutriax-pro-*
self.addEventListener('activate', (event) => {
  console.log('[NutriAx Disciplina SW] Ativando e limpando caches antigos do Disciplina...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Exclui estritamente caches legados do Disciplina, preservando o Pro
          if (cache.startsWith('nutriax-disciplina-') && cache !== CACHE_NAME) {
            console.log(`[NutriAx Disciplina SW] Removendo cache legado do Disciplina: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch: Stale-While-Revalidate com Fallback exclusivo para /disciplina/
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Ignora APIs e Firebase
  if (
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('script.google.com')
  ) {
    return;
  }

  // Navegação de páginas HTML offline: fallback estrito para /disciplina/
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return (await caches.match('./')) || (await caches.match('/disciplina/')) || (await caches.match('/disciplina/index.html'));
        })
    );
    return;
  }

  // Assets estáticos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
