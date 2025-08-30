
'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp, deleteDoc, onSnapshot, getDoc, runTransaction, DocumentData, orderBy, updateDoc, increment, collectionGroup } from 'firebase/firestore';
import { Loader2, Sparkles, Zap, ThumbsUp, ThumbsDown, Info, Crown, Bot, ArrowLeft, MessageSquare, Phone } from 'lucide-react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { botNames, botOpenerMessages } from '@/config/bot-config';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';

const DAILY_MATCH_LIMIT = 10;
const AVG_WAIT_SECONDS_PER_USER = 15;
const BOT_MATCH_TIMEOUT = 15 * 1000; // 15 seconds

function ShuffleContent() {
    const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
    const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [remainingMatches, setRemainingMatches] = useState<number | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = auth.currentUser;
    const { toast } = useToast();
    
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)

    const [showFeedback, setShowFeedback] = useState(false);
    const [queueSize, setQueueSize] = useState(0);
    const [queueUsers, setQueueUsers] = useState<DocumentData[]>([]);
    
    const botMatchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasBeenMatchedRef = useRef(false);

    const estimatedWaitTime = Math.max(15, queueSize * AVG_WAIT_SECONDS_PER_USER);

     useEffect(() => {
        if (!api) {
            return
        }

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])

    // Fetch current user's profile and match count
    useEffect(() => {
        if (!currentUser) {
            setIsLoadingProfile(false);
            return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserProfile(data);
                const today = new Date().toISOString().split('T')[0];

                if (data.isPremium) {
                    setRemainingMatches(Infinity);
                } else {
                    if (data.dailyMatch?.date === today) {
                        setRemainingMatches(Math.max(0, DAILY_MATCH_LIMIT - data.dailyMatch.count));
                    } else {
                        // Reset daily match count if date is old
                        setDoc(userDocRef, { dailyMatch: { date: today, count: 0 } }, { merge: true });
                        setRemainingMatches(DAILY_MATCH_LIMIT);
                         toast({
                            title: "Eşleşme Hakkı Yenilendi",
                            description: `Bugün için ${DAILY_MATCH_LIMIT} yeni rastgele eşleşme hakkınız var!`,
                        });
                    }
                }
            } else {
                toast({ title: 'Profil bilgileri bulunamadı.', variant: 'destructive' });
            }
            setIsLoadingProfile(false);
        });

        return () => unsubscribe();
    }, [currentUser, toast]);

    useEffect(() => {
        if (searchParams.get('feedback') === 'true') {
            setShowFeedback(true);
        }
    }, [searchParams]);
    
    const createBotMatch = useCallback(async () => {
        if (!currentUser || !userProfile || hasBeenMatchedRef.current) return;
        
        hasBeenMatchedRef.current = true;
        const userQueueRef = doc(db, 'randomMatchQueue', currentUser.uid);
        
        try {
             const userQueueSnap = await getDoc(userQueueRef);
             if (!userQueueSnap.exists()) {
                hasBeenMatchedRef.current = false;
                return; // User was matched with a real person, so do nothing.
             }

             await runTransaction(db, async (transaction) => {
                transaction.delete(userQueueRef); // Remove user from queue
                
                const botName = botNames[Math.floor(Math.random() * botNames.length)];
                const botId = `bot_${botName.toLowerCase().replace(/ /g, '_')}`;
                const botAvatar = `https://avatar.vercel.sh/${botId}.png`;
                const botOpener = botOpenerMessages[Math.floor(Math.random() * botOpenerMessages.length)];

                const newConvoRef = doc(collection(db, 'temporaryConversations'));
                transaction.set(newConvoRef, {
                    users: [currentUser.uid, botId],
                    user1: { uid: currentUser.uid, name: userProfile.name, avatarUrl: userProfile.avatarUrl, heartClicked: false },
                    user2: { uid: botId, name: botName, avatarUrl: botAvatar, heartClicked: false },
                    isBotMatch: true,
                    createdAt: serverTimestamp(),
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                });
                
                const messagesRef = doc(collection(newConvoRef, 'messages'));
                transaction.set(messagesRef, {
                    text: botOpener,
                    senderId: botId,
                    timestamp: serverTimestamp(),
                });
             });
        } catch (error) {
            hasBeenMatchedRef.current = false;
            console.error("Error creating bot match:", error);
        }
        
    }, [currentUser, userProfile]);

    // Listen for created conversations and queue changes
    useEffect(() => {
        if (!currentUser || status !== 'searching') {
            setQueueUsers([]);
            if (botMatchTimerRef.current) {
                clearTimeout(botMatchTimerRef.current);
            }
            return;
        }
        
        hasBeenMatchedRef.current = false;

        // Listener for my own conversation
        const convoQuery = query(collection(db, 'temporaryConversations'), where('users', 'array-contains', currentUser.uid));
        const unsubscribeConvo = onSnapshot(convoQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" && !hasBeenMatchedRef.current) {
                    hasBeenMatchedRef.current = true;
                    if (botMatchTimerRef.current) clearTimeout(botMatchTimerRef.current);
                    setStatus('matched');
                    router.push(`/random-chat/${change.doc.id}`);
                }
            });
        });

        // Listener for queue size and avatars
        const queueQuery = query(collectionGroup(db, 'randomMatchQueue'));
        const unsubscribeQueue = onSnapshot(queueQuery, async (snapshot) => {
             setQueueSize(snapshot.size);
             const userIds = snapshot.docs.map(d => d.data().uid).filter(uid => uid !== currentUser.uid).slice(0, 5);
             if (userIds.length > 0) {
                 const usersQuery = query(collection(db, 'users'), where('uid', 'in', userIds));
                 const usersSnapshot = await getDocs(usersQuery);
                 setQueueUsers(usersSnapshot.docs.map(d => d.data()));
             } else {
                 setQueueUsers([]);
             }
        });

        return () => {
            unsubscribeConvo();
            unsubscribeQueue();
             if (botMatchTimerRef.current) {
                clearTimeout(botMatchTimerRef.current);
            }
        };

    }, [currentUser, status, router]);

    const handleSearchClick = useCallback(async () => {
        if (!currentUser || !userProfile?.gender) {
            toast({ title: 'Eşleşme aramak için giriş yapmış ve profil bilgilerinizin eksiksiz olması gerekir.', variant: 'destructive' });
            return;
        }
        if (remainingMatches !== null && remainingMatches <= 0) {
            toast({ title: 'Günlük Limit Doldu', description: 'Günlük rastgele eşleşme limitinize ulaştınız. Daha fazlası için Premium\'a geçin!', variant: 'destructive' });
            router.push('/premium');
            return;
        }

        setStatus('searching');
        toast({ title: 'Sana uygun biri aranıyor...' });

        const targetGender = userProfile.gender === 'male' ? 'female' : 'male';
        const queueRef = collection(db, 'randomMatchQueue');

        try {
            await runTransaction(db, async (transaction) => {
                const premiumQuery = query(queueRef, where('gender', '==', targetGender), where('isPremium', '==', true), limit(1));
                let snapshot = await getDocs(premiumQuery);

                if (snapshot.empty) {
                    const standardQuery = query(queueRef, where('gender', '==', targetGender), limit(1));
                    snapshot = await getDocs(standardQuery);
                }
                
                const matchDoc = snapshot.docs.length > 0 ? snapshot.docs[0] : null;

                if (matchDoc) {
                    const otherUserId = matchDoc.id;
                    const otherUserData = matchDoc.data();
                    
                    transaction.delete(doc(queueRef, otherUserId));
                    
                    const newConvoRef = doc(collection(db, 'temporaryConversations'));
                    
                    transaction.set(newConvoRef, {
                        users: [currentUser.uid, otherUserData.uid],
                        user1: { uid: currentUser.uid, name: userProfile.name, avatarUrl: userProfile.avatarUrl, heartClicked: false },
                        user2: { uid: otherUserData.uid, name: otherUserData.name, avatarUrl: otherUserData.avatarUrl, heartClicked: false },
                        isBotMatch: false,
                        createdAt: serverTimestamp(),
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                    });
                } else {
                    const userQueueRef = doc(db, 'randomMatchQueue', currentUser.uid);
                     transaction.set(userQueueRef, {
                        uid: currentUser.uid,
                        gender: userProfile.gender,
                        isPremium: userProfile.isPremium || false,
                        enteredAt: serverTimestamp()
                    });
                     botMatchTimerRef.current = setTimeout(createBotMatch, BOT_MATCH_TIMEOUT);
                }

                if (!userProfile.isPremium) {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    const today = new Date().toISOString().split('T')[0];
                    if (userDocSnap.exists() && userDocSnap.data().dailyMatch?.date === today) {
                        transaction.update(userDocRef, { 'dailyMatch.count': increment(1) });
                    } else {
                        transaction.update(userDocRef, { dailyMatch: { date: today, count: 1 } });
                    }
                }
            });

        } catch (error) {
            console.error("Matching transaction failed: ", error);
            toast({ title: 'Eşleştirme sırasında bir sorun oluştu, lütfen tekrar deneyin.', variant: 'destructive' });
            setStatus('idle');
            const userQueueRef = doc(db, 'randomMatchQueue', currentUser.uid);
            await deleteDoc(userQueueRef).catch(() => {});
        }
    }, [currentUser, userProfile, toast, remainingMatches, router, createBotMatch]);
    
    const handleCancelSearch = async () => {
        if (!currentUser) return;
        setStatus('idle');
        setQueueSize(0);
        setQueueUsers([]);
         if (botMatchTimerRef.current) {
            clearTimeout(botMatchTimerRef.current);
        }
         try {
            await deleteDoc(doc(db, 'randomMatchQueue', currentUser.uid));
            toast({ title: "Arama iptal edildi." });
        } catch (error) {
            console.error("Error cancelling search:", error);
        }
    };

    const handleFeedback = (feedback: 'good' | 'bad') => {
        toast({ title: 'Geri bildiriminiz için teşekkürler!', description: 'Deneyiminizi geliştirmek için çalışıyoruz.' });
        setShowFeedback(false);
        router.replace('/shuffle', { scroll: false });
    };
    
    const SearchingUI = () => (
        <div className="w-full max-w-md flex flex-col items-center">
            <div className="relative w-48 h-48 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping"></div>
                <Avatar className="w-full h-full border-4 border-primary/50 shadow-lg animate-pulse">
                    {userProfile?.avatarUrl && <AvatarImage src={userProfile.avatarUrl}/>}
                    <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                 <AnimatePresence>
                    {queueUsers.map((user, index) => (
                        <motion.div
                            key={user.uid}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1, x: `${Math.cos(index * (2 * Math.PI / queueUsers.length)) * 120}px`, y: `${Math.sin(index * (2 * Math.PI / queueUsers.length)) * 120}px`}}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.5 }}
                            className="absolute top-1/2 left-1/2 -mt-6 -ml-6"
                        >
                            <Avatar className="w-12 h-12 border-2 border-background shadow-lg">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <h1 className="text-3xl font-bold font-headline mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Aranıyor...</h1>
            <p className="max-w-md mb-4 text-muted-foreground mx-auto">
                Sırada {queueSize} kişi var. Tahmini bekleme süresi: <span className="font-bold text-foreground">{Math.floor(estimatedWaitTime / 60)} dk {estimatedWaitTime % 60} sn</span>.
            </p>
            {userProfile?.isPremium && <Badge variant="secondary" className="border-yellow-400 text-yellow-400 bg-yellow-400/10 mb-8"><Crown className="w-3 h-3 mr-1.5"/>Premium Öncelik Aktif</Badge>}

            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full mt-4" onClick={handleCancelSearch}>
               Aramayı İptal Et
            </Button>
        </div>
    );
    
    const IdleUI = () => (
        <div className='w-full max-w-sm flex flex-col items-center'>
            <h1 className="text-3xl font-bold font-headline">Rastgele Eşleşme</h1>
            <p className="max-w-md mt-2 mb-6 text-muted-foreground mx-auto">
                Sohbet türünü seçerek sana uygun biriyle tanış.
            </p>
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
                                    disabled={isLoadingProfile || (remainingMatches !== null && remainingMatches <= 0)}
                                >
                                    {isLoadingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-3 h-5 w-5" />}
                                    Eşleşme Bul
                                </Button>
                                {remainingMatches !== null && isFinite(remainingMatches) && (
                                    <Badge variant={remainingMatches > 0 ? "secondary" : "destructive"}>
                                        Kalan Hak: {remainingMatches}
                                    </Badge>
                                )}
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
                                 <Badge variant="outline">
                                    Heyecan verici bu özellik için beklemede kal!
                                </Badge>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
            <div className="py-4 flex justify-center gap-2">
                {Array.from({ length: count }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => api?.scrollTo(i)}
                        className={cn('h-2 w-2 rounded-full transition-all', current === i + 1 ? 'w-4 bg-primary' : 'bg-muted-foreground/30')}
                    />
                ))}
            </div>
             <div className="absolute bottom-6 flex items-center text-xs text-muted-foreground gap-1">
                <Info className="w-3 h-3" />
                <span>Premium üyeler sınırsız ve öncelikli eşleşir.</span>
                <Link href="/premium" className="underline font-semibold ml-1">Yükselt</Link>
            </div>
        </div>
    );

    if (isLoadingProfile) {
        return <Loader2 className="w-12 h-12 text-primary animate-spin" />;
    }

    if (showFeedback) {
        return (
            <Card className="w-full max-w-sm text-center shadow-2xl">
                <CardHeader>
                    <CardTitle>Deneyiminiz Nasıldı?</CardTitle>
                </CardHeader>
                <CardFooter className="flex justify-center gap-4">
                    <Button variant="outline" size="lg" onClick={() => handleFeedback('bad')}>
                        <ThumbsDown className="mr-2 h-5 w-5" /> Kötüydü
                    </Button>
                    <Button size="lg" onClick={() => handleFeedback('good')} className="bg-green-600 hover:bg-green-700">
                        <ThumbsUp className="mr-2 h-5 w-5" /> İyiydi
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <>
            {status === 'idle' && <IdleUI />}
            {status === 'searching' && <SearchingUI />}
            {status === 'matched' && (
                <>
                    <h1 className="text-3xl font-bold font-headline mb-2">Eşleşme Bulundu!</h1>
                </>
            )}
        </>
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
