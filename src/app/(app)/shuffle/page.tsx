
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { findMatch } from '@/ai/flows/find-match-flow';
import { auth } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

const SEARCH_TIMEOUT = 15; // seconds

function SearchAnimation({ onCancel }: { onCancel: () => void }) {
    const [countdown, setCountdown] = useState(SEARCH_TIMEOUT);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (100 / SEARCH_TIMEOUT);
                return newProgress > 100 ? 100 : newProgress;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            clearInterval(progressInterval);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 w-full max-w-md">
            <motion.div
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5 }}
            >
                <div className="relative w-32 h-32">
                    <Loader2 className="w-32 h-32 text-primary/20 animate-spin-slow" />
                    <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold font-mono text-primary">
                        {countdown}
                    </div>
                </div>
            </motion.div>
            <h2 className="text-2xl font-bold mt-6">Sana Uygun Biri Aranıyor...</h2>
            <p className="text-muted-foreground mt-2">Bu işlem en fazla {SEARCH_TIMEOUT} saniye sürer. Lütfen bekleyin.</p>
            
            <div className="w-full mt-8 space-y-2">
                 <Progress value={progress} showValue={false} className="h-2" />
                 <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Gerçek kullanıcı aranıyor...</span>
                    <span>Bot eşleşmesi hazırlanıyor...</span>
                 </div>
            </div>
            <Button variant="outline" className="mt-8" onClick={onCancel}>
                İptal
            </Button>
        </div>
    );
}


function ShuffleContent() {
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();
    const currentUser = auth.currentUser;
    const { toast } = useToast();
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSearchingRef = useRef(false);

    useEffect(() => {
        isSearchingRef.current = isSearching;
    }, [isSearching]);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const handleSearchClick = async () => {
        if (!currentUser) {
            toast({ title: "Giriş yapmalısınız.", variant: "destructive" });
            return;
        }

        setIsSearching(true);
        
        try {
            const immediateResult = await findMatch({ userId: currentUser.uid });

            if (immediateResult && immediateResult.conversationId) {
                toast({ title: "Harika biriyle eşleştin!", description: "Sohbete yönlendiriliyorsun..." });
                setIsSearching(false);
                router.push(`/random-chat/${immediateResult.conversationId}`);
                return;
            }

            // If no immediate match, start the timer for the bot match check.
            searchTimeoutRef.current = setTimeout(async () => {
                if (!isSearchingRef.current) return;

                try {
                    const finalResult = await findMatch({ userId: currentUser.uid });
                    if (finalResult && finalResult.conversationId) {
                        toast({
                            title: finalResult.isBotMatch ? "Sana birini bulduk!" : "Harika biriyle eşleştin!",
                            description: "Sohbete yönlendiriliyorsun...",
                        });
                        router.push(`/random-chat/${finalResult.conversationId}`);
                    } else {
                        // This might happen if the user got matched exactly as the timer fired.
                        // We can add a small retry or just inform the user.
                        throw new Error("Eşleştirme sunucusundan bir yanıt alınamadı. Lütfen tekrar deneyin.");
                    }
                } catch (e: any) {
                    toast({ title: "Eşleşme ararken bir hata oluştu.", description: e.message, variant: "destructive" });
                } finally {
                    setIsSearching(false);
                }
            }, SEARCH_TIMEOUT * 1000);

        } catch (error: any) {
            console.error("Error during initial match search: ", error);
            toast({ title: "Eşleşme ararken bir hata oluştu.", description: error.message, variant: "destructive" });
            setIsSearching(false);
        }
    };
    
    const cancelSearch = () => {
        setIsSearching(false);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
    }

    if (isSearching) {
        return <SearchAnimation onCancel={cancelSearch} />;
    }

    return (
        <div className='w-full max-w-sm flex flex-col items-center'>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <h1 className="text-3xl font-bold font-headline">Rastgele Eşleşme</h1>
                <p className="max-w-md mt-2 mb-8 text-muted-foreground mx-auto text-center">
                    Tek bir tıkla yeni biriyle tanış ve 3 dakikalık sürpriz bir sohbete başla.
                </p>
                <div className="bg-background/80 backdrop-blur-sm border-2 border-primary/10 shadow-xl rounded-2xl w-full p-6 flex flex-col items-center">
                    <MessageSquare className='w-12 h-12 text-primary mb-4'/>
                    <h2 className="text-2xl font-bold mb-4">Yazılı Eşleşme</h2>
                    <Button 
                        size="lg" 
                        className="h-14 w-full text-lg rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground transition-transform hover:scale-105"
                        onClick={handleSearchClick}
                    >
                        <Zap className="mr-3 h-5 w-5" />
                        Eşleşme Bul
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

export default function ShufflePage() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
             <style>
                {`
                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin-slow {
                        animation: spin-slow 3s linear infinite;
                    }
                `}
             </style>
            <Suspense fallback={<Loader2 className="w-12 h-12 text-primary animate-spin" />}>
                <ShuffleContent />
            </Suspense>
        </div>
    );
}
