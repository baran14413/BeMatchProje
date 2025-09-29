
// Check if Firebase has already been initialized
if (typeof self.firebase === 'undefined') {
  self.importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
  self.importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = self.firebase.initializeApp(firebaseConfig);
const messaging = self.firebase.messaging(app);

// Handler for background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/app-logo.svg' 
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);

  // Increment the app badge
  if (navigator.setAppBadge) {
     navigator.setAppBadge(1).catch(error => {
       console.error("Failed to set app badge:", error);
     });
  }
});
