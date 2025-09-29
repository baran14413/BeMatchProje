
// This file needs to be in the public directory

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase services
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker with the same
// configuration as in the main app.
// Note: These values are hardcoded because environment variables are not
// accessible in the service worker context in the same way.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

let notificationCount = 0;

const updateBadge = () => {
    if (self.navigator.setAppBadge) {
        self.navigator.setAppBadge(notificationCount);
    }
};

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/app-logo.svg' // The new SVG logo
  };

  notificationCount++;
  updateBadge();

  self.registration.showNotification(notificationTitle, notificationOptions);
});
