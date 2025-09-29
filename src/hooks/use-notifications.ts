
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, auth, db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export const useNotification = () => {
  const { toast } = useToast();
  const currentUser = auth.currentUser;
  const [isSubscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check current subscription status on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && currentUser) {
      // Check current permission status
      if (Notification.permission === 'granted') {
          const checkToken = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().fcmToken) {
                    setSubscribed(true);
                } else {
                    setSubscribed(false);
                }
            } catch (e) {
                console.error("Error checking FCM token in Firestore", e);
                setSubscribed(false);
            } finally {
                setIsLoading(false);
            }
          };
          checkToken();
      } else {
         setSubscribed(false);
         setIsLoading(false);
      }
    } else {
        setIsLoading(false);
    }
  }, [currentUser]);


  // Effect to handle incoming foreground messages
  useEffect(() => {
    if (isSubscribed && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received. ', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });
        return () => unsubscribe();
    }
  }, [isSubscribed, toast]);


  // Function to request permission and get token
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !currentUser) {
        toast({ variant: 'destructive', title: 'Bildirimler desteklenmiyor veya giriş yapılmamış.' });
        return false;
    }
    
    setIsLoading(true);
    
    try {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const fcmToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (fcmToken) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, { fcmToken });
          console.log('FCM Token successfully saved to Firestore.');
          toast({ title: 'Bildirimlere abone olundu!', className: 'bg-green-500 text-white' });
          setIsLoading(false);
          return true;
        } else {
          throw new Error('FCM token alınamadı.');
        }
      } else {
        toast({ variant: 'destructive', title: 'Bildirim izni verilmedi.' });
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error getting notification permission or token:', error);
      toast({ variant: 'destructive', title: 'Bildirimler etkinleştirilemedi.' });
      setIsLoading(false);
      return false;
    }
  }, [currentUser, toast]);

  return { isSubscribed, setSubscribed, requestPermission, isLoading };
};
