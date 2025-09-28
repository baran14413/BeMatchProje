
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { findMatch } from '@/ai/flows/find-match-flow';
import { auth, db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { doc, deleteDoc } from 'firebase/firestore';

const SEARCH_TIMEOUT_SECONDS = 15;

function SearchAnimation({ onCancel, countdown }: { onCancel: () => void; countdown: number }) {
  const progress = ((SEARCH_TIMEOUT_SECONDS - countdown) / SEARCH_TIMEOUT_SECONDS) * 100;

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
      <p className="text-muted-foreground mt-2">
        Bu işlem en fazla {SEARCH_TIMEOUT_SECONDS} saniye sürer. Lütfen bekleyin.
      </p>

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
  const [countdown, setCountdown] = useState(SEARCH_TIMEOUT_SECONDS);
  const router = useRouter();
  const currentUser = auth.currentUser;
  const { toast } = useToast();
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFindingMatch = useRef(false);

  const stopSearch = async () => {
    setIsSearching(false);
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    // As a cleanup, try to remove user from waiting pool if they cancel
    if (currentUser) {
        const userInPoolRef = doc(db, 'waitingPool', currentUser.uid);
        await deleteDoc(userInPoolRef).catch(() => {});
    }
    isFindingMatch.current = false;
  };

  const startCountdown = () => {
    setCountdown(SEARCH_TIMEOUT_SECONDS);
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    searchIntervalRef.current = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
  };
  
  const handleSearchClick = async () => {
    if (!currentUser || isFindingMatch.current) {
      if (!currentUser) toast({ title: 'Giriş yapmalısınız.', variant: 'destructive' });
      return;
    }

    isFindingMatch.current = true;
    setIsSearching(true); // Show searching UI immediately

    try {
      const result = await findMatch({ userId: currentUser.uid });
      
      if (result.conversationId) {
        toast({ title: 'Harika biriyle eşleştin!', description: 'Sohbete yönlendiriliyorsun...' });
        stopSearch();
        router.push(`/random-chat/${result.conversationId}`);
      } else {
        // If no immediate match, start the countdown.
        startCountdown();
      }

    } catch (error: any) {
      console.error('Error during initial match search: ', error);
      toast({ title: 'Eşleşme ararken bir hata oluştu.', description: error.message, variant: 'destructive' });
      stopSearch();
    } finally {
      // Don't set isFindingMatch.current to false here if we are waiting for countdown
      if (!isSearching) {
          isFindingMatch.current = false;
      }
    }
  };

  // This effect runs when the countdown finishes
  useEffect(() => {
    const handleFinalSearch = async () => {
        if (!currentUser) return;
        isFindingMatch.current = true;
        try {
            const finalResult = await findMatch({ userId: currentUser.uid });
            if (finalResult.conversationId) {
                toast({
                    title: finalResult.isBotMatch ? "Sana birini bulduk!" : "Harika biriyle eşleştin!",
                    description: "Sohbete yönlendiriliyorsun...",
                });
                router.push(`/random-chat/${finalResult.conversationId}`);
            } else {
                 throw new Error("Eşleştirme sunucusundan bir yanıt alınamadı. Lütfen tekrar deneyin.");
            }
        } catch (e: any) {
            toast({ title: "Eşleşme ararken bir hata oluştu.", description: e.message, variant: "destructive" });
        } finally {
            stopSearch();
        }
    };
    
    if (countdown <= 0 && isSearching) {
        if(searchIntervalRef.current) clearInterval(searchIntervalRef.current);
        handleFinalSearch();
    }
  }, [countdown, isSearching, currentUser, router, toast]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
      }
      // If component unmounts while searching, try to remove from pool
      if (isSearching && currentUser) {
          const userInPoolRef = doc(db, 'waitingPool', currentUser.uid);
          deleteDoc(userInPoolRef).catch(() => {});
      }
    };
  }, [isSearching, currentUser]);

  if (isSearching) {
    return <SearchAnimation onCancel={stopSearch} countdown={countdown} />;
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-bold font-headline">Rastgele Eşleşme</h1>
        <p className="max-w-md mt-2 mb-8 text-muted-foreground mx-auto text-center">
          Tek bir tıkla yeni biriyle tanış ve 3 dakikalık sürpriz bir sohbete başla.
        </p>
        <div className="bg-background/80 backdrop-blur-sm border-2 border-primary/10 shadow-xl rounded-2xl w-full p-6 flex flex-col items-center">
          <MessageSquare className="w-12 h-12 text-primary mb-4" />
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
