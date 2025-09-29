
// This file should be in the 'public' directory

// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// "Default" Firebase app (the app used by your main web app) is automatically
// initialized based on the default project config values.
// You can retrieve the firebase config from the environment variables
const firebaseConfig = {
  apiKey: self.location.hostname === 'localhost' ? 'your_local_api_key' : process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: self.location.hostname === 'localhost' ? 'your_local_auth_domain' : process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: self.location.hostname === 'localhost' ? 'your_local_project_id' : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: self.location.hostname === 'localhost' ? 'your_local_storage_bucket' : process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.location.hostname === 'localhost' ? 'your_local_messaging_sender_id' : process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: self.location.hostname === 'localhost' ? 'your_local_app_id' : process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/app-logo.svg', // Ensure you have this icon in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
