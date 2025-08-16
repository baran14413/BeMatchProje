
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AnimatedLogo = () => {
    const text = "BeMatch";
    return (
        <div className="flex justify-center items-center" aria-label={text}>
            {text.split("").map((char, index) => (
                <span
                    key={index}
                    className="text-6xl md:text-8xl font-bold text-primary animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    {char}
                </span>
            ))}
        </div>
    );
};

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Add a small delay to allow animation to be seen
      setTimeout(() => {
        if (user) {
          // User is signed in, redirect to the main app page
          router.replace('/match');
        } else {
          // User is signed out, redirect to the login page
          router.replace('/login');
        }
      }, 2000); 
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="flex flex-col items-center gap-8">
        <AnimatedLogo />
        <div className="relative flex items-center justify-center">
            <Heart className="w-12 h-12 text-primary animate-pulse-heart" style={{ animationDelay: '0.7s' }} />
        </div>
      </div>
    </main>
  );
}
