
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
        <h1 className="text-4xl font-bold font-headline tracking-tighter">
            <span className="text-blue-500">Be</span>Match
        </h1>
        <div className="relative flex h-24 w-24 items-center justify-center">
            <div className={cn("animate-ripple-1 absolute h-full w-full rounded-full bg-primary/20")} />
            <div className={cn("animate-ripple-2 absolute h-full w-full rounded-full bg-primary/20")} />
            <div className={cn("animate-ripple-3 absolute h-full w-full rounded-full bg-primary/20")} />
            <Heart className="h-16 w-16 text-primary fill-primary animate-pulse-heart" />
        </div>
    </div>
  );
};


export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Add a small delay to allow animation to be seen
      // and ensure the app is ready before redirecting.
      const redirectTimeout = setTimeout(() => {
        if (user) {
          // User is signed in, redirect to the main app page
          router.replace('/explore');
        } else {
          // User is signed out, redirect to the login page
          router.replace('/login');
        }
      }, 2500); 

      // On unmount, clear the timeout if it hasn't fired yet
      return () => clearTimeout(redirectTimeout);
    });

    // On unmount, unsubscribe from auth state changes
    return () => unsubscribe();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 relative">
       <div className="flex-1 flex items-center justify-center">
          <SplashScreen />
       </div>
       <div className="absolute bottom-10 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">Created by</p>
            <div className="bg-white rounded-md py-1 px-2 shadow-md">
                <span className="font-bold text-xl tracking-wider text-black">
                    <span className="text-blue-500">B</span>E
                </span>
            </div>
       </div>
    </main>
  );
}
