// ═══════════════════════════════════════════════════════════
// NutriAx Pro & Disciplina — Service Worker de Migração e Transição
// Fase 9: Desregistra o SW legado da raiz e remove caches legados
// ═══════════════════════════════════════════════════════════

const LEGACY_CACHE_NAME = 'nutriax-pro-v1.9.0';

self.addEventListener('install', (event) => {
  console.log('[NutriAx Migration SW] Desativando Service Worker legado da raiz...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[NutriAx Migration SW] Executando transição para /pro/ e /disciplina/...');
  event.waitUntil(
    (async () => {
      // 1. Remove EXCLUSIVAMENTE o cache legado da versão 1.9.0
      // NUNCA toca em nutriax-pro-v2.* ou nutriax-disciplina-*
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (name === LEGACY_CACHE_NAME || name.startsWith('nutriax-pro-v1.')) {
            console.log(`[NutriAx Migration SW] Removendo cache legado específico: ${name}`);
            return caches.delete(name);
          }
        })
      );

      // 2. Desregistra este Service Worker do escopo raiz
      try {
        await self.registration.unregister();
        console.log('[NutriAx Migration SW] Service Worker raiz desregistrado com sucesso.');
      } catch (err) {
        console.warn('[NutriAx Migration SW] Erro ao desregistrar:', err);
      }

      // 3. Notifica clientes controlados
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({ type: 'PWA_MIGRATED', target: client.url });
      });
    })()
  );
});

// Em fetch, não faz cache de nada e apenas passa requisições à rede
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
