
// Check if Firebase has been initialized
if (typeof self.firebase === 'undefined' || !self.firebase.apps.length) {
    self.importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
    self.importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');
}

const firebaseConfig = {
    apiKey: "__FIREBASE_API_KEY__",
    authDomain: "__FIREBASE_AUTH_DOMAIN__",
    projectId: "__FIREBASE_PROJECT_ID__",
    storageBucket: "__FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__FIREBASE_APP_ID__",
    measurementId: "__FIREBASE_MEASUREMENT_ID__",
};

// It's safe to re-initialize, it's a no-op if already initialized.
self.firebase.initializeApp(firebaseConfig);

const messaging = self.firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/app-logo.svg', // Main app icon for notifications
    badge: '/icons/badge-72x72.png', // Badge for Android status bar
    vibrate: [200, 100, 200], // Vibrate pattern
    tag: payload.notification.tag || 'bematch-notification', // Group notifications
    data: payload.data // Pass along data for click actions
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/'; // Default to home if no URL is provided

  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
