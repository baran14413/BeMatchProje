
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            // Give a moment for the initial check, then redirect.
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (user) {
                // User is logged in, check for profile completion
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().username) {
                         router.replace('/match');
                    } else {
                        // Profile is incomplete or doesn't exist, go to signup flow
                        router.replace('/signup?step=2&reason=complete_profile');
                    }
                } catch (error) {
                    console.error("Error checking user profile, redirecting to login", error);
                    router.replace('/login');
                }
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
