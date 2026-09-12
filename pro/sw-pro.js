// ═══════════════════════════════════════════════════════════
// NutriAx Pro — Service Worker Exclusivo do Ambiente Clínico
// Escopo: /pro/ | Cache: nutriax-pro-v2.0.0
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = 'nutriax-pro-v2.0.0';

const PRECACHE_ASSETS = [
  '/pro/',
  '/pro/index.html',
  '/pro/manifest.json',
  '/pro/icons/icon-192.png',
  '/pro/icons/icon-512.png',
  '/pro/icons/icon.svg',
  '/pro/icons/apple-touch-icon.png',
  '/pro/icons/favicon.png',
  '/app.js',
  '/styles.css',
  '/db.js',
  '/math.js',
  '/foodsData.js',
  '/firebase-service.js',
  '/fasting-module.js',
  '/domain/contracts/TrainingPrescriptionDTO.js',
  '/lucide.min.js',
  '/chart.min.js',
  '/logo.png',
  '/nutritionist.jpg'
];

// 1. Instalação: Pré-cache restrito aos recursos do NutriAx Pro
self.addEventListener('install', (event) => {
  console.log('[NutriAx Pro SW] Instalando Service Worker e cacheando recursos clínicos...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.warn(`[NutriAx Pro SW] Falha ao baixar: ${url} (Status: ${response.status})`);
            })
            .catch((err) => {
              console.warn(`[NutriAx Pro SW] Erro ao buscar: ${url}`, err);
            })
        )
      );
    }).then(() => {
      console.log('[NutriAx Pro SW] Pré-cache clínico concluído.');
      return self.skipWaiting();
    })
  );
});

// 2. Ativação: Limpeza seletiva — NUNCA toca em nutriax-disciplina-*
self.addEventListener('activate', (event) => {
  console.log('[NutriAx Pro SW] Ativando e limpando caches antigos do Pro...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Exclui estritamente caches legados do Pro, preservando Disciplina
          if (cache.startsWith('nutriax-pro-') && cache !== CACHE_NAME) {
            console.log(`[NutriAx Pro SW] Removendo cache legado do Pro: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch: Stale-While-Revalidate com Fallback exclusivo para /pro/
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

  // Navegação de páginas HTML offline: fallback estrito para /pro/
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
          return (await caches.match('/pro/')) || (await caches.match('/pro/index.html'));
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
