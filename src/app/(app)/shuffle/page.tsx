
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { findMatch } from '@/ai/flows/find-match-flow';
import { auth } from '@/lib/firebase';
import { motion } from 'framer-motion';

function ShuffleContent() {
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    const handleSearchClick = async () => {
        if (!currentUser) {
            toast({ title: "Giriş yapmalısınız.", variant: "destructive" });
            return;
        }

        setIsSearching(true);

        try {
            const result = await findMatch({ userId: currentUser.uid });
            
            if (result && result.conversationId) {
                toast({
                    title: result.isBotMatch ? "Sana birini bulduk!" : "Harika biriyle eşleştin!",
                    description: "Sohbete yönlendiriliyorsun...",
                });
                router.push(`/random-chat/${result.conversationId}`);
            } else {
                throw new Error("Eşleşme akışından bir sohbet ID'si dönmedi.");
            }

        } catch (error: any) {
            console.error("Error during match search: ", error);
            toast({ title: "Eşleşme ararken bir hata oluştu.", description: error.message, variant: "destructive" });
            setIsSearching(false);
        }
    };

    if (isSearching) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 w-full max-w-md">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <h2 className="text-2xl font-bold mt-6">Sana Uygun Biri Aranıyor...</h2>
                <p className="text-muted-foreground mt-2">Bu işlem genellikle 15 saniye sürer. Lütfen bekleyin.</p>
                 <Button variant="outline" className="mt-8" onClick={() => setIsSearching(false) /* This is a simple cancel, but won't stop the backend process */}>
                    İptal
                </Button>
            </div>
        );
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
            <Suspense fallback={<Loader2 className="w-12 h-12 text-primary animate-spin" />}>
                <ShuffleContent />
            </Suspense>
        </div>
    );
}
