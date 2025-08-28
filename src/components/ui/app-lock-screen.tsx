
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Fingerprint, Loader2 } from 'lucide-react';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';

interface AppLockScreenProps {
  onUnlock: () => void;
}

const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handlePinChange = (value: string) => {
    if (isVerifying) return;
    setError('');
    if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setError('');
    setPin(pin.slice(0, -1));
  };

  const verifyPin = useCallback(
    (enteredPin: string) => {
      setIsVerifying(true);
      setTimeout(() => {
        const configStr = localStorage.getItem('app-lock-config');
        if (configStr) {
          const config = JSON.parse(configStr);
          if (config.pin === enteredPin) {
            onUnlock();
          } else {
            setError('Hatalı PIN. Lütfen tekrar deneyin.');
            setPin('');
          }
        } else {
          // Should not happen if this screen is shown
          setError('Kilit ayarları bulunamadı.');
        }
        setIsVerifying(false);
      }, 500);
    },
    [onUnlock]
  );

  useEffect(() => {
    if (pin.length === 4) {
      verifyPin(pin);
    }
  }, [pin, verifyPin]);
  
   const handleBiometricAuth = useCallback(async () => {
    try {
        if (!navigator.credentials || !window.PublicKeyCredential) {
            toast({ variant: 'destructive', title: 'Biyometrik doğrulama bu tarayıcıda desteklenmiyor.'});
            return;
        }
        
      // This is a simplified check. A real implementation requires a server challenge.
      // For this demo, we'll just check if the user can interact with the API.
      const isSupported = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isSupported) {
          toast({ variant: 'destructive', title: 'Cihazınızda biyometrik doğrulama ayarlı değil.'});
          return
      }

      // In a real app, you would get challenge from a server.
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [],
          // In a real app, you would specify your relying party ID (your domain)
          // rpId: 'example.com',
          userVerification: 'required',
        },
      });
      
      if (credential) {
         toast({ title: 'Kimlik doğrulandı!', className: 'bg-green-500 text-white'});
         onUnlock();
      }

    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Biyometrik doğrulama başarısız oldu.'});
    }
  }, [onUnlock, toast]);
  
   useEffect(() => {
    const configStr = localStorage.getItem('app-lock-config');
    if (configStr) {
        const config = JSON.parse(configStr);
        if (config.isBiometricEnabled) {
            handleBiometricAuth();
        }
    }
   }, [handleBiometricAuth]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 rounded-lg">
        <Fingerprint className="w-16 h-16 text-primary" />
        <h1 className="text-2xl font-bold">Uygulama Kilidi</h1>
        <p className="text-muted-foreground">Devam etmek için PIN kodunuzu girin.</p>

        <div className="flex items-center gap-4 my-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all ${
                pin.length > index ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-sm font-medium text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-4 w-64">
          {[...Array(9)].map((_, i) => (
            <Button
              key={i}
              variant="outline"
              className="h-16 text-2xl font-bold rounded-full"
              onClick={() => handlePinChange(String(i + 1))}
            >
              {i + 1}
            </Button>
          ))}
          <div />
          <Button
            variant="outline"
            className="h-16 text-2xl font-bold rounded-full"
            onClick={() => handlePinChange('0')}
          >
            0
          </Button>
          <Button
            variant="ghost"
            className="h-16 rounded-full text-muted-foreground"
            onClick={handleDelete}
          >
            Sil
          </Button>
        </div>
      </div>
       {isVerifying && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )}
    </div>
  );
};

export default AppLockScreen;
