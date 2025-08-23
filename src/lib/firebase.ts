
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc, serverTimestamp as firestoreServerTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp, goOffline, goOnline } from 'firebase/database';

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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

// Presence management
const setupPresence = (userId: string) => {
    const userStatusDatabaseRef = ref(rtdb, '/status/' + userId);
    const userFirestoreRef = doc(db, 'users', userId);

    const isOfflineForDatabase = {
        isOnline: false,
        lastSeen: rtdbServerTimestamp(),
    };
    
    const isOnlineForDatabase = {
        isOnline: true,
    };
    
    const isOfflineForFirestore = {
        isOnline: false,
        lastSeen: firestoreServerTimestamp(),
    };

    const isOnlineForFirestore = {
        isOnline: true,
    };

    const connectedRef = ref(rtdb, '.info/connected');
    
    const listener = onValue(connectedRef, (snap) => {
        if (snap.val() === false) {
            updateDoc(userFirestoreRef, isOfflineForFirestore);
            return;
        }

        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            set(userStatusDatabaseRef, isOnlineForDatabase);
            updateDoc(userFirestoreRef, isOnlineForFirestore);
        });
    });

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            goOffline(rtdb);
        } else {
            goOnline(rtdb);
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        // Clean up the listener when it's no longer needed
        // This is a placeholder as onValue returns an unsubscribe function directly
    };
};


export { app, auth, db, storage, setupPresence };
