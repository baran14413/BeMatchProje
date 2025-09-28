
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            // Give a moment for the initial check, then redirect.
            await new Promise(resolve => setTimeout(resolve, 500));
            
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
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </main>
    );
}
