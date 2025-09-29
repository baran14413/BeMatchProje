
// DO NOT CHANGE: This file is essential for background notifications.
// It must be in the public folder to be accessible by the browser.

// Import Firebase scripts directly, as module imports can be tricky in service workers.
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Your web app's Firebase configuration
// IMPORTANT: These values must be manually kept in sync with your .env file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


// Initialize Firebase
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// This event listener handles push notifications when the app is in the background or closed.
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');

  // The 'data' property of the push event is a PushMessageData object.
  // We parse it as JSON to get the notification data sent from the server.
  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    console.error('Push event data is not valid JSON.', e);
    notificationData = {
        notification: {
            title: 'Yeni bir bildirimin var',
            body: 'Kontrol etmek için dokun.',
            icon: '/icons/app-logo.svg'
        }
    };
  }

  const { title, body, icon, tag } = notificationData.notification;
  
  const options = {
    body: body,
    icon: icon || '/icons/app-logo.svg', // Default icon if not provided
    badge: '/icons/badge.png', // Small monochrome icon for the status bar
    vibrate: [200, 100, 200], // Vibration pattern
    tag: tag || 'bematch-notification', // Groups notifications
    renotify: true,
    actions: [
        { action: 'open_app', title: 'Uygulamayı Aç' }
    ]
  };

  // The waitUntil() method ensures the service worker doesn't terminate
  // until the notification is shown.
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// This event listener handles clicks on the notification.
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  // This opens the app to the root page.
  // You can customize this to open a specific URL.
  event.waitUntil(
    clients.openWindow('/')
  );
});
