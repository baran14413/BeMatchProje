
import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp as firestoreServerTimestamp, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED, clearIndexedDbPersistence, terminate } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp, goOffline, goOnline } from 'firebase/database';
import { getMessaging } from 'firebase/messaging';
import 'firebase/compat/firestore';
import firebase from 'firebase/compat/app';


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

if (!getApps().length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);
const messaging = (typeof window !== 'undefined') ? getMessaging(app) : null;


// Enable offline persistence
if (typeof window !== 'undefined') {
    try {
        enableIndexedDbPersistence(db, {
            cacheSizeBytes: CACHE_SIZE_UNLIMITED
        }).catch((err) => {
            if (err.code == 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled
                // in one tab at a time.
                console.warn('Firestore persistence failed: multiple tabs open.');
            } else if (err.code == 'unimplemented') {
                // The current browser does not support all of the
                // features required to enable persistence
                console.warn('Firestore persistence not available in this browser.');
            }
        });
    } catch (error) {
        console.error("Error enabling Firestore persistence:", error);
    }
}

export const clearCache = async () => {
    try {
        await terminate(db);
        // Delete the firebase app to release all resources
        await deleteApp(getApp());
        
        // Unregister all service workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }
        
        // Clear Cache Storage
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        
        // Clear IndexedDB for Firestore
        const dbName = `firebase-indexeddb-main-` + firebaseConfig.projectId;
        const deleteRequest = indexedDB.deleteDatabase(dbName);

        return new Promise<void>((resolve, reject) => {
            deleteRequest.onsuccess = () => {
                console.log("Firestore IndexedDB cache cleared successfully.");
                resolve();
            };
            deleteRequest.onerror = (event) => {
                console.error("Error clearing Firestore IndexedDB cache:", event);
                reject(new Error("Could not clear IndexedDB cache."));
            };
             deleteRequest.onblocked = () => {
                console.warn("Clearing IndexedDB is blocked. Please close other tabs with this app open.");
                reject(new Error("Clearing cache is blocked. Close other tabs."));
            };
        });

    } catch (error) {
        console.error("Error during cache clearing process:", error);
        throw error;
    }
};


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
            // Use setDoc with merge to avoid error if document doesn't exist yet
            setDoc(userFirestoreRef, isOfflineForFirestore, { merge: true });
            return;
        }

        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            set(userStatusDatabaseRef, isOnlineForDatabase);
            // Use setDoc with merge here as well
            setDoc(userFirestoreRef, isOnlineForFirestore, { merge: true });
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


export { app, auth, db, storage, messaging, setupPresence };
