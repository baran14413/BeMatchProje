
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, addDoc, serverTimestamp, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { Loader2, Sparkles, Zap, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function ShuffleContent() {
    const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
    const [userGender, setUserGender] = useState<string | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
        if (searchParams.get('feedback') === 'true') {
            setShowFeedback(true);
        }
    }, [searchParams]);

    // Fetch current user's gender
    useEffect(() => {
        const fetchGender = async () => {
            setIsLoadingProfile(true);
            if (currentUser) {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUserGender(userDoc.data().gender);
                } else {
                    toast({ title: 'Profil bilgileri bulunamadı.', variant: 'destructive' });
                }
            }
            setIsLoadingProfile(false);
        };
        fetchGender();
    }, [currentUser, toast]);
    
     // Listen for created conversations to redirect
    useEffect(() => {
        if (!currentUser || status !== 'searching') return;

        const q = query(
            collection(db, 'temporaryConversations'), 
            where('users', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    setStatus('matched');
                    router.push(`/random-chat/${change.doc.id}`);
                }
            });
        });

        // Clean up listener when component unmounts or status changes
        return () => unsubscribe();

    }, [currentUser, status, router]);

    const handleSearchClick = async () => {
        if (!currentUser || !userGender) {
            toast({ title: 'Eşleşme aramak için giriş yapmış olmalısınız ve profil bilgileriniz eksiksiz olmalı.', variant: 'destructive' });
            return;
        }

        setStatus('searching');
        toast({ title: 'Sana uygun biri aranıyor...' });

        const targetGender = userGender === 'male' ? 'female' : 'male';
        const queueRef = collection(db, 'randomMatchQueue');

        try {
            // Check if there's a compatible user in the queue
            const q = query(queueRef, where('gender', '==', targetGender), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Match found
                const otherUserDoc = querySnapshot.docs[0];
                const otherUserData = otherUserDoc.data();
                
                // Remove the matched user from the queue
                await deleteDoc(doc(db, 'randomMatchQueue', otherUserDoc.id));

                // Create a temporary conversation
                const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
                const otherUserInfoDoc = await getDoc(doc(db, 'users', otherUserData.uid));
                
                const currentUserData = currentUserDoc.data();
                const otherUserInfo = otherUserInfoDoc.data();
                
                if (!currentUserData || !otherUserInfo) throw new Error("Kullanıcı bilgileri alınamadı.");

                const usersArray = [currentUser.uid, otherUserData.uid];

                const newConvoRef = await addDoc(collection(db, 'temporaryConversations'), {
                    user1: { 
                        uid: currentUser.uid, 
                        name: currentUserData.name, 
                        avatarUrl: currentUserData.avatarUrl,
                        heartClicked: false 
                    },
                    user2: { 
                        uid: otherUserData.uid,
                        name: otherUserInfo.name,
                        avatarUrl: otherUserInfo.avatarUrl,
                        heartClicked: false
                    },
                    users: usersArray,
                    createdAt: serverTimestamp(),
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
                });
                
                // The useEffect listener will handle the redirect
                setStatus('matched');

            } else {
                // No match found, add user to the queue
                const userQueueRef = doc(db, 'randomMatchQueue', currentUser.uid);
                await setDoc(userQueueRef, {
                    uid: currentUser.uid,
                    gender: userGender,
                    enteredAt: serverTimestamp()
                });
            }

        } catch (error) {
            console.error("Error during matching:", error);
            toast({ title: "Eşleşme sırasında bir hata oluştu.", variant: 'destructive' });
            setStatus('idle');
        }
    };
    
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

    if (showFeedback) {
        return (
            <Card className="w-full max-w-sm text-center">
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
                        className="h-16 px-10 text-xl rounded-full"
                        onClick={handleSearchClick}
                        disabled={isLoadingProfile}
                    >
                        {isLoadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Eşleşme Bul
                    </Button>
                </>
            )}

            {status === 'searching' && (
                <>
                    <Loader2 className="w-24 h-24 text-primary mb-6 animate-spin" />
                    <h1 className="text-3xl font-bold font-headline mb-2">Aranıyor...</h1>
                    <p className="max-w-md mb-8 text-muted-foreground">
                        Sana en uygun kişiyle eşleştirilmek için bekleniyor. Lütfen bu ekrandan ayrılma.
                    </p>
                    <Button 
                        size="lg" 
                        variant="destructive"
                        className="h-14 px-8 text-lg rounded-full"
                        onClick={handleCancelSearch}
                    >
                       Aramayı İptal Et
                    </Button>
                </>
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
