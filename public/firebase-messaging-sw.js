// POKOLA Firebase Cloud Messaging Service Worker for Lesotho Student Loans
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "rugged-antonym-2lcf1",
  appId: "1:209125701928:web:6dcf96e921b879485ab81d",
  apiKey: "AIzaSyBA02YoOs9s3I2RoL-L1UarGaxNa6rOz7M",
  messagingSenderId: "209125701928",
  authDomain: "rugged-antonym-2lcf1.firebaseapp.com"
};

firebase.initializeApp(firebaseConfig);

let messaging;
try {
  messaging = firebase.messaging();
} catch (err) {
  console.log('[FCM SW] Firebase messaging initialize note:', err);
}

// Background push notification listener
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Received background push payload:', payload);

    const title = payload.notification?.title || payload.data?.title || 'POKOLA Lesotho Student Alert';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'You have an important update regarding your student loan.',
      icon: '/assets/icon.png',
      badge: '/assets/icon.png',
      tag: payload.data?.category || 'pokola_notification',
      data: {
        url: payload.data?.actionUrl || '/',
        category: payload.data?.category || 'loan_status',
        timestamp: new Date().toISOString()
      },
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open_app', title: 'Open POKOLA' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    self.registration.showNotification(title, notificationOptions);
  });
}

// Handle notification click action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
