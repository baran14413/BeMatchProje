
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            // Give a moment for the initial check, then redirect.
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (user) {
                // User is logged in, redirect to the main app experience
                router.replace('/explore');
            } else {
                // User is not logged in, redirect to the login page
                router.replace('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
            <div className="w-16 h-16 rounded-full animate-loader-spin border-4 border-t-transparent"></div>
            <p className="mt-4 text-lg text-muted-foreground font-semibold animate-pulse">Yükleniyor...</p>
        </main>
    );
}
