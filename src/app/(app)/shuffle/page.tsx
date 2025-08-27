
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, addDoc, serverTimestamp, deleteDoc, onSnapshot, getDoc, runTransaction, DocumentData } from 'firebase/firestore';
import { Loader2, Sparkles, Zap, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatePresence, motion } from 'framer-motion';

function ShuffleContent() {
    const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
    const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    const [showFeedback, setShowFeedback] = useState(false);
    const [queueUsers, setQueueUsers] = useState<DocumentData[]>([]);

    useEffect(() => {
        if (searchParams.get('feedback') === 'true') {
            setShowFeedback(true);
        }
    }, [searchParams]);

    // Fetch current user's profile
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoadingProfile(true);
            if (currentUser) {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data());
                } else {
                    toast({ title: 'Profil bilgileri bulunamadı.', variant: 'destructive' });
                }
            }
            setIsLoadingProfile(false);
        };
        fetchProfile();
    }, [currentUser, toast]);
    
     // Listen for created conversations to redirect
    useEffect(() => {
        if (!currentUser || status !== 'searching') return;

        const q = query(
            collection(db, 'temporaryConversations'), 
            where('users', 'array-contains', currentUser.uid)
        );

        const unsubscribeConvo = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    setStatus('matched');
                    router.push(`/random-chat/${change.doc.id}`);
                }
            });
        });
        
        // Listen for queue size changes
        const queueQuery = query(collection(db, 'randomMatchQueue'), where('uid', '!=', currentUser.uid), limit(5));
        const unsubscribeQueue = onSnapshot(queueQuery, async (snapshot) => {
            const userIds = snapshot.docs.map(d => d.data().uid);
            if (userIds.length > 0) {
                 const usersQuery = query(collection(db, 'users'), where('uid', 'in', userIds));
                 const usersSnapshot = await getDocs(usersQuery);
                 setQueueUsers(usersSnapshot.docs.map(d => d.data()));
            } else {
                setQueueUsers([]);
            }
        });

        // Clean up listeners when component unmounts or status changes
        return () => {
            unsubscribeConvo();
            unsubscribeQueue();
        };

    }, [currentUser, status, router]);

    const handleSearchClick = useCallback(async () => {
        if (!currentUser || !userProfile?.gender) {
            toast({ title: 'Eşleşme aramak için giriş yapmış olmalısınız ve profil bilgileriniz eksiksiz olmalı.', variant: 'destructive' });
            return;
        }

        setStatus('searching');
        toast({ title: 'Sana uygun biri aranıyor...' });

        const targetGender = userProfile.gender === 'male' ? 'female' : 'male';
        const queueRef = collection(db, 'randomMatchQueue');

        try {
            // Check if there is someone of the opposite gender in the queue
            const q = query(queueRef, where('gender', '==', targetGender), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Potential match found, start a transaction to claim it
                const otherUserDoc = querySnapshot.docs[0];
                const otherUserData = otherUserDoc.data();

                await runTransaction(db, async (transaction) => {
                    const potentialMatchRef = doc(db, 'randomMatchQueue', otherUserDoc.id);
                    const potentialMatchSnap = await transaction.get(potentialMatchRef);

                    if (!potentialMatchSnap.exists()) {
                        // The user was matched by someone else just now, so we add the current user to queue instead.
                        const userQueueRef = doc(db, 'randomMatchQueue', currentUser.uid);
                        transaction.set(userQueueRef, {
                            uid: currentUser.uid,
                            gender: userProfile.gender,
                            enteredAt: serverTimestamp()
                        });
                        return; // Exit transaction
                    }

                    // Match is still available, proceed to create conversation
                    transaction.delete(potentialMatchRef);

                    const otherUserInfoSnap = await getDoc(doc(db, 'users', otherUserData.uid));
                    const otherUserInfo = otherUserInfoSnap.data();

                    if (!userProfile || !otherUserInfo) {
                        throw new Error("Kullanıcı bilgileri alınamadı.");
                    }

                    const newConvoRef = doc(collection(db, 'temporaryConversations'));
                    transaction.set(newConvoRef, {
                        user1: {
                            uid: currentUser.uid,
                            name: userProfile.name,
                            avatarUrl: userProfile.avatarUrl,
                            heartClicked: false
                        },
                        user2: {
                            uid: otherUserData.uid,
                            name: otherUserInfo.name,
                            avatarUrl: otherUserInfo.avatarUrl,
                            heartClicked: false
                        },
                        users: [currentUser.uid, otherUserData.uid],
                        createdAt: serverTimestamp(),
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
                    });
                });

            } else {
                // No match found, add current user to the queue
                const userQueueRef = doc(db, 'randomMatchQueue', currentUser.uid);
                await setDoc(userQueueRef, {
                    uid: currentUser.uid,
                    gender: userProfile.gender,
                    enteredAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error during matching:", error);
            toast({ title: "Eşleşme sırasında bir hata oluştu.", variant: 'destructive' });
            setStatus('idle');
        }
    }, [currentUser, userProfile, toast]);
    
    const handleCancelSearch = async () => {
        if (!currentUser) return;
        setStatus('idle');
         try {
            await deleteDoc(doc(db, 'randomMatchQueue', currentUser.uid));
            toast({ title: "Arama iptal edildi." });
        } catch (error) {
            console.error("Error cancelling search:", error);
        }
    };

    const handleFeedback = (feedback: 'good' | 'bad') => {
        toast({
            title: 'Geri bildiriminiz için teşekkürler!',
            description: 'Deneyiminizi geliştirmek için çalışıyoruz.',
        });
        setShowFeedback(false);
        router.replace('/shuffle', { scroll: false }); // Clean URL
    };
    
     const renderSearchingUI = () => {
        if (queueUsers.length > 0) {
            return (
                <div className="relative w-48 h-48 mx-auto mb-8">
                    <AnimatePresence>
                        {queueUsers.map((user, index) => (
                            <motion.div
                                key={user.uid}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1, rotate: (360 / queueUsers.length) * index }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.5 }}
                                style={{ transformOrigin: '100px 100px' }}
                                className="absolute top-1/2 left-1/2 -mt-8 -ml-8"
                            >
                                <Avatar className="w-16 h-16 border-4 border-background shadow-lg" style={{ transform: `translateX(100px) rotate(-${(360 / queueUsers.length) * index}deg)` }}>
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )
        }
        
        if (userProfile?.avatarUrl) {
             return (
                 <div className="relative w-40 h-40 mx-auto mb-8 animate-beat">
                    <Avatar className="w-full h-full border-4 border-primary/50 shadow-lg">
                        <AvatarImage src={userProfile.avatarUrl}/>
                        <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
             )
        }

        return (
            <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ripple-1"></div>
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ripple-2"></div>
                <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0 m-auto" />
            </div>
        )
    }


    if (showFeedback) {
        return (
            <Card className="w-full max-w-sm text-center shadow-2xl">
                <CardHeader>
                    <CardTitle>Deneyiminiz Nasıldı?</CardTitle>
                    <CardDescription>Son rastgele sohbetiniz hakkındaki geri bildiriminiz, gelecekteki eşleşmeleri iyileştirmemize yardımcı olur.</CardDescription>
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
            {status === 'idle' && (
                <>
                    <Zap className="w-24 h-24 text-primary mb-6" />
                    <h1 className="text-3xl font-bold font-headline mb-2">Rastgele Eşleşme</h1>
                    <p className="max-w-md mb-8 text-muted-foreground">
                        Butona tıkla ve o an eşleşme arayan başka biriyle anında sohbete başla.
                        Sohbeti kalıcı hale getirmek için 5 dakikanız var!
                    </p>
                    <Button 
                        size="lg" 
                        className="h-16 px-10 text-xl rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground transition-transform hover:scale-105"
                        onClick={handleSearchClick}
                        disabled={isLoadingProfile}
                    >
                        {isLoadingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-3 h-5 w-5" />}
                        Eşleşme Bul
                    </Button>
                </>
            )}

            {status === 'searching' && (
                <div className="w-full max-w-md">
                    {renderSearchingUI()}
                    <h1 className="text-3xl font-bold font-headline mb-2">Aranıyor...</h1>
                    <p className="max-w-md mb-8 text-muted-foreground mx-auto">
                        Sana en uygun kişiyle eşleştirilmek için bekleniyor. Lütfen bu ekrandan ayrılma.
                    </p>
                    <Button 
                        size="lg" 
                        variant="outline"
                        className="h-14 px-8 text-lg rounded-full mt-8"
                        onClick={handleCancelSearch}
                    >
                       Aramayı İptal Et
                    </Button>
                </div>
            )}

            {status === 'matched' && (
                <>
                    <Sparkles className="w-24 h-24 text-green-500 mb-6 animate-pulse" />
                    <h1 className="text-3xl font-bold font-headline mb-2">Eşleşme Bulundu!</h1>
                    <p className="max-w-md mb-8 text-muted-foreground">
                        Sohbete yönlendiriliyorsun...
                    </p>
                </>
            )}
        </>
    );
}


export default function ShufflePage() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Suspense fallback={<Loader2 className="w-24 h-24 text-primary mb-6 animate-spin" />}>
                <ShuffleContent />
            </Suspense>
        </div>
    )
}
