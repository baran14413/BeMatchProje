
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const loadingMessages = [
    "Bağlantı kuruluyor...",
    "Güvenlik kontrolü yapılıyor...",
    "Oturum doğrulanıyor...",
    "Her şeyi profesyonel hale getiriyoruz...",
    "Neredeyse hazır!",
];

const SplashScreen = () => {
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => (prev >= 100 ? 100 : prev + 5));
        }, 100); 

        const messageInterval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % loadingMessages.length);
        }, 1200);

        return () => {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm text-center">
            <h1 className="text-6xl font-bold font-headline tracking-tighter animate-beat">
                <span className="text-blue-500">Be</span>
                <span className="text-primary">Match</span>
            </h1>
            <div className='w-full space-y-2'>
                <p className="text-sm text-muted-foreground transition-opacity duration-500">{loadingMessages[messageIndex]}</p>
                <Progress value={progress} className="w-full h-1.5" indicatorClassName="bg-gradient-to-r from-blue-500 to-primary"/>
            </div>
        </div>
    );
};

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // No more setTimeout. Redirect as soon as auth state is known.
            // The destination page will handle its own loading state.
            if (user) {
                router.replace('/explore');
            } else {
                router.replace('/login');
            }
        });

        // Cleanup the subscription when the component unmounts
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
