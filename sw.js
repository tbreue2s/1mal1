self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((k) => k.includes('workbox') || k.includes('precache')).map((k) => caches.delete(k))
        );
      } catch (e) {}
      try {
        await self.registration.unregister();
      } catch (e) {}
      try {
        const clientsList = await self.clients.matchAll({ type: 'window' });
        for (const client of clientsList) {
          client.navigate('https://tbreue2s.github.io/zahlenblitz/');
        }
      } catch (e) {}
    })()
  );
});
