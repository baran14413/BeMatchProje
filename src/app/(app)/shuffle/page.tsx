
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, MessageSquare, Phone } from 'lucide-react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, runTransaction, increment, serverTimestamp, collection, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { botNames, botOpenerMessages } from '@/config/bot-config';

function ShuffleContent() {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    
    const router = useRouter();
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);
    
    const handleSearchClick = async () => {
        if (!currentUser) {
            toast({ title: "Giriş yapmalısınız.", variant: "destructive"});
            return;
        }

        setIsSearching(true);
        const userDocRef = doc(db, 'users', currentUser.uid);

        try {
            // Check user's match credits
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) throw new Error("Kullanıcı bulunamadı.");

            const userData = userDoc.data();
            const today = new Date().toISOString().split('T')[0];

            if (!userData.isPremium) {
                if (userData.dailyMatch?.date === today && userData.dailyMatch?.count >= 3) {
                     toast({
                        title: "Günlük Limit Doldu",
                        description: "3 ücretsiz hakkınızı kullandınız. Daha fazlası için premium'a geçin veya yarın tekrar deneyin.",
                        variant: "destructive"
                    });
                    setIsSearching(false);
                    return;
                }
            }

            // Find a waiting user or create a new waiting entry
            const waitingPoolRef = collection(db, 'waitingPool');
            const newEntryRef = await addDoc(waitingPoolRef, {
                uid: currentUser.uid,
                name: currentUser.displayName,
                avatarUrl: currentUser.photoURL,
                waitingSince: serverTimestamp(),
            });

            // Start a 15-second timer to find a match or create a bot match
            const matchTimer = setTimeout(async () => {
                 const entrySnap = await getDoc(newEntryRef);
                 if (!entrySnap.exists()) return; // Already matched
                
                 await deleteDoc(newEntryRef);
                 createBotMatch();

            }, 15000); // 15 seconds

             const unsubscribe = onSnapshot(newEntryRef, (docSnap) => {
                if (!docSnap.exists()) { // This means we got matched
                    clearTimeout(matchTimer);
                    unsubscribe(); // Stop listening
                    // The other user will create the convo and we'll be redirected
                } else if (docSnap.data().matchedWith) {
                    clearTimeout(matchTimer);
                    unsubscribe();
                    const conversationId = docSnap.data().conversationId;
                    if(conversationId) {
                         router.push(`/random-chat/${conversationId}`);
                    }
                }
            });


        } catch (error) {
            console.error("Error starting match search: ", error);
            toast({ title: "Eşleşme ararken bir hata oluştu.", variant: "destructive" });
            setIsSearching(false);
        }
    };
    
    const createBotMatch = async () => {
        if (!currentUser) return;
        
        toast({
            title: "Sana birini bulduk!",
            description: "Harika biriyle eşleştin. Sohbete yönlendiriliyorsun...",
        });

        const botId = `bot_${Math.random().toString(36).substring(2, 9)}`;
        const botName = botNames[Math.floor(Math.random() * botNames.length)];
        const botAvatar = `https://avatar.iran.liara.run/public/girl?username=${botName}`;
        
        const conversationId = [currentUser.uid, botId].sort().join('-');
        const convoRef = doc(db, 'temporaryConversations', conversationId);
        
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        await setDoc(convoRef, {
            user1: { uid: currentUser.uid, name: currentUser.displayName, avatarUrl: currentUser.photoURL, heartClicked: false },
            user2: { uid: botId, name: botName, avatarUrl: botAvatar, heartClicked: false },
            isBotMatch: true,
            createdAt: serverTimestamp(),
            expiresAt: expiresAt,
        });

        const messagesRef = collection(convoRef, 'messages');
        await addDoc(messagesRef, {
            text: botOpenerMessages[Math.floor(Math.random() * botOpenerMessages.length)],
            senderId: botId,
            timestamp: serverTimestamp()
        });

        router.push(`/random-chat/${conversationId}`);
    }

    if (isSearching) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8">
                <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                <h2 className="text-2xl font-bold">Sana Uygun Biri Aranıyor...</h2>
                <p className="text-muted-foreground mt-2">Bu işlem genellikle 15 saniye sürer. Lütfen bekleyin.</p>
                <Button variant="outline" className="mt-8" onClick={() => setIsSearching(false)}>Aramayı İptal Et</Button>
            </div>
        )
    }

    return (
        <div className='w-full max-w-sm flex flex-col items-center'>
            <h1 className="text-3xl font-bold font-headline">Rastgele Eşleşme</h1>
            <p className="max-w-md mt-2 mb-4 text-muted-foreground mx-auto">
                Sohbet türünü seçerek sana uygun biriyle tanış.
            </p>
            <div className="mb-4 flex justify-center gap-2">
                {Array.from({ length: count }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => api?.scrollTo(i)}
                        className={cn('h-2 w-2 rounded-full transition-all', current === i ? 'w-4 bg-primary' : 'bg-muted-foreground/30')}
                    />
                ))}
            </div>
            <Carousel setApi={setApi} className="w-full">
                <CarouselContent>
                    <CarouselItem>
                         <Card className="bg-background/80 backdrop-blur-sm border-2 border-primary/10 shadow-xl rounded-2xl w-full">
                            <CardHeader className='items-center'>
                                <MessageSquare className='w-12 h-12 text-primary mb-2'/>
                                <CardTitle className="text-2xl font-bold">Yazılı Eşleşme</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                                <Button 
                                    size="lg" 
                                    className="h-14 w-full text-lg rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground transition-transform hover:scale-105"
                                    onClick={handleSearchClick}
                                >
                                    <Zap className="mr-3 h-5 w-5" />
                                    Eşleşme Bul
                                </Button>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                    <CarouselItem>
                         <Card className="bg-muted/50 border-2 border-dashed shadow-none rounded-2xl w-full">
                            <CardHeader className='items-center'>
                                <Phone className='w-12 h-12 text-muted-foreground mb-2'/>
                                <CardTitle className="text-2xl font-bold text-muted-foreground">Sesli Eşleşme</CardTitle>
                            </CardHeader>
                             <CardContent className="flex flex-col items-center gap-4">
                                <Button 
                                    size="lg" 
                                    className="h-14 w-full text-lg rounded-full"
                                    disabled
                                >
                                    Yakında...
                                </Button>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </div>
    );
}


export default function ShufflePage() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
            <Suspense fallback={<Loader2 className="w-12 h-12 text-primary animate-spin" />}>
                <ShuffleContent />
            </Suspense>
        </div>
    );
}
