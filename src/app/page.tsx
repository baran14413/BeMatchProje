
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Lottie from 'lottie-react';
import animationData from '../../../public/images/loaderemir.json';

const initialMessages = [
    "Bağlantı kuruluyor...",
    "Güvenlik kontrolü yapılıyor...",
    "Oturum doğrulanıyor...",
    "Her şeyi profesyonel hale getiriyoruz...",
    "Neredeyse hazır!",
];

const SplashScreen = ({ messages }: { messages: string[] }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const messageInterval = setInterval(() => {
            setMessageIndex(prev => {
                if (prev === messages.length - 1) {
                    clearInterval(messageInterval);
                    return prev;
                }
                return (prev + 1) % messages.length;
            });
        }, 1200);

        return () => {
            clearInterval(messageInterval);
        };
    }, [messages]);

    return (
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm text-center">
            <h1 className="text-6xl font-bold font-headline tracking-tighter animate-beat">
                <span className="text-blue-500">Be</span>
                <span className="text-primary">Match</span>
            </h1>
            <div className='w-full space-y-2'>
                 <Lottie animationData={animationData} loop={true} style={{ width: 150, height: 150, margin: 'auto' }} />
                <p className="text-sm text-muted-foreground transition-opacity duration-500 h-5">{messages[messageIndex]}</p>
            </div>
        </div>
    );
};

export default function Home() {
    const router = useRouter();
    const [loadingMessages, setLoadingMessages] = useState(initialMessages);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            // Give splash screen a minimum time to display
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setLoadingMessages(prev => [...prev.slice(0, prev.length -1), `${userData.name}, hoş geldin!`]);
                        
                        setTimeout(() => {
                            router.replace('/explore');
                        }, 1500); 

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
