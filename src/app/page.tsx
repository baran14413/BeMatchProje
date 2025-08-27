
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';


const SplashScreen = () => {
    const [progress, setProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('Uygulama başlatılıyor...');
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
             if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setUsername(userDoc.data().name);
                    }
                } catch (error) {
                    console.error("Kullanıcı verisi alınamadı:", error);
                }
            }
        });
        
        return () => unsubscribe();
    }, []);

     useEffect(() => {
        const timer = setInterval(() => {
            setProgress(oldProgress => {
                if (oldProgress >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                const diff = Math.random() * 10;
                return Math.min(oldProgress + diff, 100);
            });
        }, 500);

        return () => {
            clearInterval(timer);
        };
    }, []);
    
     useEffect(() => {
        if (progress > 30 && username) {
            setLoadingMessage(`Hoş geldin, ${username.split(' ')[0]}!`);
        }
        if (progress > 60) {
            setLoadingMessage('Sizin için her şeyi hazırlıyoruz...');
        }
    }, [progress, username]);


    return (
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm text-center">
            <h1 className="text-6xl font-bold font-headline tracking-tighter animate-beat">
                <span className="text-blue-500">Be</span>
                <span className="text-primary">Match</span>
            </h1>
            <div className='w-full space-y-4'>
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
                 <div className="h-10 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground transition-opacity duration-500">
                        {loadingMessage}
                    </p>
                </div>
                 <Progress value={progress} className="w-full h-2" />
            </div>
        </div>
    );
};

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            // Give splash screen a minimum time to display
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        router.replace('/explore');
                    } else {
                         // This case might happen if auth record exists but firestore doc doesn't
                         // Log out the user and send to login to be safe
                         await auth.signOut();
                         router.replace('/login');
                    }
                } catch (error) {
                    console.error("Error fetching user data, redirecting to login", error);
                    router.replace('/login');
                }
            } else {
                router.replace('/login');
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
