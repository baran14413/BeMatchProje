
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, MessageSquare, Phone, Timer } from 'lucide-react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { findMatch } from '@/ai/flows/find-match-flow';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteDoc, doc } from 'firebase/firestore';

function ShuffleContent() {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    
    const [timeLeft, setTimeLeft] = useState(15);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const searchCancelledRef = useRef(false);

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
    
    // Cleanup function to run when the component unmounts or the user navigates away
    useEffect(() => {
        return () => {
            if (currentUser && isSearching) {
                deleteDoc(doc(db, 'waitingPool', currentUser.uid));
            }
             if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [currentUser, isSearching]);

    const stopSearch = async (showToast = true) => {
        searchCancelledRef.current = true;
        setIsSearching(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (currentUser) {
            await deleteDoc(doc(db, 'waitingPool', currentUser.uid)).catch(e => console.warn("Could not clean up waiting pool:", e));
        }
        if(showToast) {
            toast({ title: "Arama iptal edildi." });
        }
    };
    
    const handleSearchClick = async () => {
        if (!currentUser) {
            toast({ title: "Giriş yapmalısınız.", variant: "destructive"});
            return;
        }

        setIsSearching(true);
        searchCancelledRef.current = false;
        
        try {
            // First attempt: try to find a match or enter the pool
            const initialResult = await findMatch({ userId: currentUser.uid });
            
            if (searchCancelledRef.current) return;

            if (initialResult && initialResult.conversationId) {
                // Matched instantly!
                 toast({
                    title: "Harika biriyle eşleştin!",
                    description: "Sohbete yönlendiriliyorsun...",
                });
                router.push(`/random-chat/${initialResult.conversationId}`);
                setIsSearching(false);
                return;
            }

            // If not matched instantly, we are in the pool. Start the countdown.
            setTimeLeft(15);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                       if(timerRef.current) clearInterval(timerRef.current);
                        // Time's up, call findMatch again to get a bot
                        findMatch({ userId: currentUser.uid }).then(botResult => {
                           if (searchCancelledRef.current) return;
                           if (botResult && botResult.conversationId) {
                               toast({ title: "Sana birini bulduk!", description: "Sohbete yönlendiriliyorsun..."});
                               router.push(`/random-chat/${botResult.conversationId}`);
                           } else {
                               stopSearch(false);
                               toast({ title: "Eşleşme bulunamadı.", description: "Lütfen tekrar deneyin.", variant: "destructive"});
                           }
                        }).catch(e => {
                            stopSearch(false);
                            toast({ title: "Bir hata oluştu.", variant: "destructive"});
                        });

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error: any) {
            console.error("Error starting match search: ", error);
            toast({ title: "Eşleşme ararken bir hata oluştu.", description: error.message, variant: "destructive" });
            setIsSearching(false);
        }
    };
    
    if (isSearching) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 w-full max-w-md">
                <div className="relative mb-6">
                     <Timer className="w-16 h-16 text-primary" />
                     <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-primary"
                        style={{fontVariantNumeric: 'tabular-nums'}}
                     >
                        {timeLeft}
                     </div>
                </div>
                <h2 className="text-2xl font-bold">Sana Uygun Biri Aranıyor...</h2>
                <p className="text-muted-foreground mt-2 mb-6">Bu işlem en fazla 15 saniye sürer. Lütfen bekleyin.</p>
                <div className="w-full flex items-center gap-1 h-2">
                    {Array.from({length: 15}).map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-full h-full bg-primary/20 rounded-full"
                            initial={{ scaleY: 0.5, opacity: 0.5 }}
                            animate={{ 
                                scaleY: (15 - timeLeft) > i ? 1 : 0.5, 
                                opacity: (15 - timeLeft) > i ? 1 : 0.5,
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    ))}
                </div>
                <Button variant="outline" className="mt-8" onClick={() => stopSearch()}>
                    Aramayı İptal Et
                </Button>
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
