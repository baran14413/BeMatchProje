
'use client';

import { useState, useEffect } from 'react';

// Extend the global Navigator interface to include the 'connection' property
// which is still experimental in some browsers but widely supported.
declare global {
  interface Navigator {
    connection?: {
      effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
      addEventListener: (type: 'change', listener: EventListenerOrEventListenerObject) => void;
      removeEventListener: (type: 'change', listener: EventListenerOrEventListenerObject) => void;
    };
  }
}

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isPoorConnection, setIsPoorConnection] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined') {
        setIsOnline(navigator.onLine);
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleConnectionChange = () => {
        if (navigator.connection) {
            const { effectiveType } = navigator.connection;
            setIsPoorConnection(effectiveType === '2g' || effectiveType === 'slow-2g');
        }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (navigator.connection) {
        navigator.connection.addEventListener('change', handleConnectionChange);
        // Initial check for connection quality
        handleConnectionChange();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navigator.connection) {
          navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return { isOnline, isPoorConnection };
};
