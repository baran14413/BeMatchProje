
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Loader2, Sparkles, Zap } from 'lucide-react';

export default function ShufflePage() {
    const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
    const [userGender, setUserGender] = useState<string | null>(null);
    const router = useRouter();
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    // Fetch current user's gender
    useEffect(() => {
        const fetchGender = async () => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUserGender(userDoc.data().gender);
                } else {
                    toast({ title: 'Profil bilgileri bulunamadı.', variant: 'destructive' });
                }
            }
        };
        fetchGender();
    }, [currentUser, toast]);
    
     // Listen for created conversations to redirect
    useEffect(() => {
        if (!currentUser || status !== 'searching') return;

        const unsubscribe = onSnapshot(collection(db, 'temporaryConversations'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    if ((data.user1.uid === currentUser.uid || data.user2.uid === currentUser.uid)) {
                        setStatus('matched');
                        router.push(`/random-chat/${change.doc.id}`);
                    }
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
                const currentUserData = (await getDoc(doc(db, 'users', currentUser.uid))).data();
                const otherUserInfo = (await getDoc(doc(db, 'users', otherUserData.uid))).data();
                
                if (!currentUserData || !otherUserInfo) throw new Error("Kullanıcı bilgileri alınamadı.");

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

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
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
                    >
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
        </div>
    );
}
