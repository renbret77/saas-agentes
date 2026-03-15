"use client"

export class PushService {
    static async notify(title: string, body: string, url: string = '/dashboard') {
        if (typeof window === 'undefined') return;

        if (!("serviceWorker" in navigator) || !("Notification" in window)) {
            console.warn("Push notifications not supported");
            return;
        }

        if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;
        }

        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [100, 50, 100],
            data: { url }
        });
    }
}
