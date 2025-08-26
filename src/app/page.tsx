
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Progress } from '@/components/ui/progress';
import { doc, getDoc } from 'firebase/firestore';

const initialMessages = [
    "Bağlantı kuruluyor...",
    "Güvenlik kontrolü yapılıyor...",
    "Oturum doğrulanıyor...",
    "Her şeyi profesyonel hale getiriyoruz...",
    "Neredeyse hazır!",
];

const SplashScreen = ({ messages }: { messages: string[] }) => {
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => (prev >= 100 ? 100 : prev + 5));
        }, 100); 

        const messageInterval = setInterval(() => {
            setMessageIndex(prev => {
                // If it's the last message, don't cycle back
                if (prev === messages.length - 1) {
                    clearInterval(messageInterval);
                    return prev;
                }
                return (prev + 1) % messages.length;
            });
        }, 1200);

        return () => {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
        };
    }, [messages.length]);

    return (
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm text-center">
            <h1 className="text-6xl font-bold font-headline tracking-tighter animate-beat">
                <span className="text-blue-500">Be</span>
                <span className="text-primary">Match</span>
            </h1>
            <div className='w-full space-y-2'>
                <p className="text-sm text-muted-foreground transition-opacity duration-500">{messages[messageIndex]}</p>
                <Progress value={progress} className="w-full h-1.5" indicatorClassName="bg-gradient-to-r from-blue-500 to-primary"/>
            </div>
        </div>
    );
};

export default function Home() {
    const router = useRouter();
    const [loadingMessages, setLoadingMessages] = useState(initialMessages);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Update the loading message with the user's name
                        setLoadingMessages(prev => [...prev, `${userData.name}, hoş geldin!`]);
                        
                        // Wait a moment for the welcome message to be visible, then redirect
                        setTimeout(() => {
                            router.replace('/explore');
                        }, 1500); // Show welcome message for 1.5 seconds

                    } else {
                        // User exists in Auth, but not in Firestore. Redirect to login to be safe.
                         setTimeout(() => router.replace('/login'), 1000);
                    }
                } catch (error) {
                    console.error("Error fetching user data, redirecting to login", error);
                    setTimeout(() => router.replace('/login'), 1000);
                }
            } else {
                // No user, redirect to login after a short delay to allow splash to show
                setTimeout(() => {
                    router.replace('/login');
                }, 2000);
            }
        });

        // Cleanup the subscription when the component unmounts
        return () => unsubscribe();
    }, [router]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 relative">
            <div className="flex-1 flex items-center justify-center">
                <SplashScreen messages={loadingMessages} />
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
