// ═══════════════════════════════════════════════════════════
// NutriAx Pro — Service Worker (PWA Engine)
// Offline Support & Smart Caching Strategy
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = 'nutriax-pro-v1.3.6';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './db.js',
  './math.js',
  './foodsData.js',
  './logo.png',
  './nutritionist.jpg',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './apple-touch-icon.png',
  './favicon.png'
];

// 1. Instalação: Pré-cache dos ativos vitais da aplicação
self.addEventListener('install', (event) => {
  console.log('[NutriAx SW] Instalando Service Worker e cacheando recursos...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Faz o cache dos arquivos locais com tolerância a falhas individuais
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.warn(`[NutriAx SW] Falha ao baixar: ${url} (Status: ${response.status})`);
            })
            .catch((err) => {
              console.warn(`[NutriAx SW] Erro ao buscar: ${url}`, err);
            })
        )
      );
    }).then(() => {
      console.log('[NutriAx SW] Pré-cache concluído com sucesso.');
      return self.skipWaiting();
    })
  );
});

// 2. Ativação: Limpeza de caches antigos e assumir controle imediato
self.addEventListener('activate', (event) => {
  console.log('[NutriAx SW] Ativando novo Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log(`[NutriAx SW] Removendo cache legado: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Interceptação de Requisições (Fetch): Estratégia Stale-While-Revalidate + Cache Fallback
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET ou esquemas que não sejam HTTP/HTTPS (ex: chrome-extension)
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Requisições para a API do Google Script ou rotas de dados externos -> Network First
  if (event.request.url.includes('script.google.com') || event.request.url.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline', message: 'Sem conexão com a nuvem no momento.' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Navegação de páginas HTML (ex: reload offline)
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
          return caches.match('./index.html') || caches.match('/');
        })
    );
    return;
  }

  // Para ativos locais e CDNs: Stale-While-Revalidate
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
        .catch((err) => {
          // Em caso de falha de rede e sem cache, retorna fallback vazio ou erro suave
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Mensagens recebidas da aplicação (ex: skipWaiting sob demanda)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
