
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';


const SplashScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
        <h1 className="text-6xl font-bold font-headline tracking-tighter animate-beat">
            <span className="text-blue-500">Be</span>
            <span className="text-primary">Match</span>
        </h1>
    </div>
  );
};


export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const redirectTimeout = setTimeout(() => {
        if (user) {
          router.replace('/explore');
        } else {
          router.replace('/login');
        }
      }, 2500); 

      return () => clearTimeout(redirectTimeout);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 relative">
       <div className="flex-1 flex items-center justify-center">
          <SplashScreen />
       </div>
       <div className="absolute bottom-8 flex flex-col items-center gap-1">
            <p className="text-xs font-light text-muted-foreground tracking-wider">Created By</p>
            <span className="font-bold text-lg tracking-widest">
                <span className="text-blue-500">B</span>E
            </span>
       </div>
    </main>
  );
}
