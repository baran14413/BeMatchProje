
'use client';

import { WifiOff, SignalLow } from 'lucide-react';
import { cn } from '@/lib/utils';

type NetworkStatusBannerProps = {
  isOnline: boolean;
  isPoorConnection: boolean;
};

export const NetworkStatusBanner = ({ isOnline, isPoorConnection }: NetworkStatusBannerProps) => {
  if (isOnline && !isPoorConnection) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-2 text-sm text-white text-center transition-transform',
        isOffline ? 'bg-red-600' : 'bg-yellow-500'
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="mr-2 h-4 w-4" />
          İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.
        </>
      ) : (
        <>
          <SignalLow className="mr-2 h-4 w-4" />
          İnternet bağlantınız zayıf görünüyor.
        </>
      )}
    </div>
  );
};
