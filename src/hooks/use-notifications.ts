
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, auth, db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { doc, updateDoc } from 'firebase/firestore';

export const useNotification = () => {
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !currentUser) {
      return;
    }

    const messaging = getMessaging(app);

    // 1. Request Permission
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // 2. Get Token
          const fcmToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });

          if (fcmToken) {
            // 3. Save Token to Firestore
            console.log('FCM Token:', fcmToken);
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
              fcmToken: fcmToken,
            });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };

    requestPermission();

    // 4. Handle Foreground Messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received. ', payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    return () => {
      unsubscribe();
    };

  }, [currentUser, toast]);
};
