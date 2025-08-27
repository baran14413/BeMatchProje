
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const LoadingDots = () => (
    <div className="flex items-center justify-center gap-1">
        <span>Yükleniyor</span>
        <span className="animate-ellipsis-dot">.</span>
        <span className="animate-ellipsis-dot">.</span>
        <span className="animate-ellipsis-dot">.</span>
    </div>
);


const SplashScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm text-center">
            <h1 className="text-6xl font-bold font-headline tracking-tighter animate-beat">
                <span className="text-blue-500">Be</span>
                <span className="text-primary">Match</span>
            </h1>
            <div className='w-full space-y-2'>
                <video 
                    src="/videos/Loading 40 _ Paperplane.mp4" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    width="150" 
                    height="150"
                    className="mx-auto"
                />
                 <div className="text-sm text-muted-foreground transition-opacity duration-500 h-5">
                    <LoadingDots />
                </div>
            </div>
        </div>
    );
};

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            // Give splash screen a minimum time to display
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        router.replace('/explore');
                    } else {
                         setTimeout(() => router.replace('/login'), 1000);
                    }
                } catch (error) {
                    console.error("Error fetching user data, redirecting to login", error);
                    setTimeout(() => router.replace('/login'), 1000);
                }
            } else {
                setTimeout(() => {
                    router.replace('/login');
                }, 2000);
            }
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
