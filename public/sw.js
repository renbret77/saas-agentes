// RB Proyectos - Service Worker (v2.9.15)
// Soporte para Notificaciones Push y Almacenamiento fuera de línea base.

self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker instalándose...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activo y listo.');
});

// Listener para notificaciones Push
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { 
        title: 'RB Proyectos', 
        body: 'Nueva notificación de tu Agente Digital.' 
    };

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/dashboard'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Abrir URL al hacer clic en notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
