
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TinderCard from 'react-tinder-card';
import { Heart, X, Undo, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, getDoc, addDoc, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type UserProfile = {
  uid: string;
  name: string;
  age: number;
  city: string;
  avatarUrl: string;
  bio: string;
  aiHint?: string;
};

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

const UserCardSkeleton = () => (
    <div className="relative w-full h-full rounded-2xl bg-muted shadow-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-white rounded-b-2xl">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4" />
        </div>
    </div>
)


export default function ShufflePage() {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastSwipedProfile, setLastSwipedProfile] = useState<{ profile: UserProfile, dir: SwipeDirection } | null>(null);
    const [match, setMatch] = useState<UserProfile | null>(null);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const canSwipe = currentIndex < profiles.length;
    const canGoBack = !!lastSwipedProfile;

    const currentUser = auth.currentUser;
    const { toast } = useToast();
    const router = useRouter();


    useEffect(() => {
        if (!currentUser) return;

        const fetchProfiles = async () => {
            setLoading(true);
            try {
                const swipesQuery = query(collection(db, 'users', currentUser.uid, 'swipes'));
                const swipesSnapshot = await getDocs(swipesQuery);
                const swipedIds = swipesSnapshot.docs.map(doc => doc.id);
                const ignoredIds = [currentUser.uid, ...swipedIds];

                const profilesQuery = query(
                    collection(db, 'users'), 
                    where('uid', 'not-in', ignoredIds.length > 0 ? ignoredIds : ['dummyId']),
                    limit(10)
                );
                
                const querySnapshot = await getDocs(profilesQuery);
                const fetchedProfiles = querySnapshot.docs.map(doc => doc.data() as UserProfile);
                
                setProfiles(fetchedProfiles);
                setCurrentIndex(0);

            } catch (error) {
                console.error("Error fetching profiles:", error);
                toast({ title: "Profiller yüklenirken bir hata oluştu.", variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, [currentUser, toast]);


    const childRefs = useMemo(
        () =>
        Array(profiles.length)
            .fill(0)
            .map((i) => React.createRef<any>()),
        [profiles.length]
    );
    
    const updateCurrentIndex = (val: number) => {
        setCurrentIndex(val);
    };


    const swiped = async (direction: SwipeDirection, swipedUser: UserProfile, index: number) => {
        if (!currentUser) return;
        
        updateCurrentIndex(index + 1);
        setLastSwipedProfile({ profile: swipedUser, dir: direction });

        try {
            const batch = writeBatch(db);

            const swipeRef = doc(db, 'users', currentUser.uid, 'swipes', swipedUser.uid);
            batch.set(swipeRef, { swipe: direction, swipedAt: serverTimestamp() });

            if (direction === 'right') {
                const otherUserSwipeRef = doc(db, 'users', swipedUser.uid, 'swipes', currentUser.uid);
                const otherUserSwipeDoc = await getDoc(otherUserSwipeRef);

                if (otherUserSwipeDoc.exists() && otherUserSwipeDoc.data().swipe === 'right') {
                   setMatch(swipedUser);
                   
                   const conversationRef = doc(collection(db, 'conversations'));
                   batch.set(conversationRef, {
                       users: [currentUser.uid, swipedUser.uid],
                       lastMessage: null,
                       createdAt: serverTimestamp()
                   });
                   
                   const currentUserMatchRef = doc(db, 'users', currentUser.uid, 'matches', swipedUser.uid);
                   batch.set(currentUserMatchRef, {
                       name: swipedUser.name,
                       avatarUrl: swipedUser.avatarUrl,
                       matchedAt: serverTimestamp(),
                       conversationId: conversationRef.id
                   });
                   
                   const otherUserMatchRef = doc(db, 'users', swipedUser.uid, 'matches', currentUser.uid);
                   batch.set(otherUserMatchRef, {
                       name: currentUser.displayName,
                       avatarUrl: currentUser.photoURL,
                       matchedAt: serverTimestamp(),
                       conversationId: conversationRef.id
                   });
                }
            }
            await batch.commit();

        } catch (error) {
             console.error("Error processing swipe:", error);
             toast({ title: "Etkileşim kaydedilirken bir hata oluştu.", variant: 'destructive' });
        }
    };
    
    const goBack = async () => {
        if (!canGoBack || !currentUser || !lastSwipedProfile) return;

        const newIndex = currentIndex - 1;
        
        const { profile: lastProfile } = lastSwipedProfile;

        // Optimistically update UI
        setProfiles(prev => [lastProfile, ...prev.slice(newIndex)]);
        setCurrentIndex(newIndex);
        setLastSwipedProfile(null);


        try {
             // Remove swipe from database
            const swipeRef = doc(db, 'users', currentUser.uid, 'swipes', lastProfile.uid);
            await deleteDoc(swipeRef);
        } catch(error) {
            console.error("Error undoing swipe:", error);
            toast({ title: "İşlem geri alınamadı.", variant: 'destructive' });
            // Revert UI if db operation fails (optional, depends on desired UX)
        }
    };

    const swipe = async (dir: SwipeDirection) => {
        if (canSwipe && currentIndex < profiles.length) {
          await childRefs[currentIndex].current?.swipe(dir);
        }
    };

    const NoMoreProfiles = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
            <Sparkles className="w-24 h-24 text-primary mb-6 opacity-50" />
            <h1 className="text-3xl font-bold font-headline mb-2">Şimdilik hepsi bu kadar!</h1>
            <p className="max-w-md mb-8">
                Etrafındaki tüm profilleri gördün. Daha sonra yeni gelenler için tekrar kontrol et.
            </p>
        </div>
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] p-4 gap-8">
                <div className='w-full max-w-sm h-full max-h-[500px]'>
                    <UserCardSkeleton />
                </div>
                <div className="flex items-center justify-center gap-6">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <Skeleton className="w-20 h-20 rounded-full" />
                </div>
            </div>
        )
    }

    if (match && currentUser) {
        return (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 animate-fade-in-up">
                 <h1 className="text-5xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-8">Eşleşme!</h1>
                 <p className="text-muted-foreground text-lg mb-8 text-center">{match.name} ile artık eşleştin.</p>
                 <div className="flex items-center justify-center gap-8">
                    <Avatar className="w-32 h-32 border-4 border-primary">
                        <AvatarImage src={currentUser.photoURL || ''} data-ai-hint="current user" />
                        <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <Avatar className="w-32 h-32 border-4 border-pink-500">
                        <AvatarImage src={match.avatarUrl} data-ai-hint={match.name} />
                        <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                 </div>
                 <div className="mt-12 flex flex-col w-full max-w-xs gap-4">
                    <Button size="lg" onClick={() => router.push('/chat')}>
                        <MessageSquare className="mr-2"/>
                        Mesaj Gönder
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setMatch(null)}>
                        Keşfetmeye Devam Et
                    </Button>
                 </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-[85vh] p-4 gap-8">
            <div className='w-full max-w-sm h-full max-h-[500px] relative'>
                {profiles.length > 0 ? profiles.map((profile, index) => (
                    <TinderCard
                        ref={childRefs[index]}
                        className='absolute w-full h-full'
                        key={profile.uid}
                        preventSwipe={['up', 'down']}
                        onSwipe={(dir) => swiped(dir as SwipeDirection, profile, index)}
                    >
                        <div className="relative w-full h-full rounded-2xl bg-cover bg-center shadow-lg" style={{ backgroundImage: `url(${profile.avatarUrl})` }}>
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-2xl"/>
                           <div className="absolute top-6 left-6 text-2xl font-bold text-red-500 border-4 border-red-500 rounded-lg px-4 py-2 -rotate-12 opacity-0 transform transition-all duration-300 ease-in-out"
                                style={{ transform: childRefs[index]?.current?.getCardState()?.x < -20 ? 'rotate(-20deg) scale(1.1)' : 'rotate(0) scale(0.9)', opacity: childRefs[index]?.current?.getCardState()?.x < -20 ? 1 : 0 }}
                            >
                               GEÇ
                           </div>
                           <div className="absolute top-6 right-6 text-2xl font-bold text-green-400 border-4 border-green-400 rounded-lg px-4 py-2 rotate-12 opacity-0 transform transition-all duration-300 ease-in-out"
                                style={{ transform: childRefs[index]?.current?.getCardState()?.x > 20 ? 'rotate(20deg) scale(1.1)' : 'rotate(0) scale(0.9)', opacity: childRefs[index]?.current?.getCardState()?.x > 20 ? 1 : 0 }}
                           >
                               BEĞEN
                           </div>
                           <div className="absolute bottom-0 w-full p-6 text-white">
                                <h3 className="text-3xl font-bold">{profile.name}, <span className="font-light">{profile.age}</span></h3>
                                <p className="text-lg opacity-90">{profile.city}</p>
                           </div>
                        </div>
                    </TinderCard>
                )) : (
                   !loading && <NoMoreProfiles />
                )}
            </div>

            {profiles.length > 0 && (
                 <div className="flex items-center justify-center gap-6">
                     <Button onClick={() => swipe('left')} variant="outline" className="w-20 h-20 rounded-full border-4 border-destructive/50 text-destructive/80 hover:bg-destructive/10 hover:text-destructive">
                        <X className="w-10 h-10" />
                    </Button>
                     <Button onClick={goBack} variant="outline" disabled={!canGoBack} className="w-16 h-16 rounded-full border-2 border-muted-foreground/50 text-muted-foreground/80 hover:bg-muted/20">
                        <Undo className="w-8 h-8" />
                    </Button>
                    <Button onClick={() => swipe('right')} variant="outline" className="w-20 h-20 rounded-full border-4 border-green-500/50 text-green-500/80 hover:bg-green-500/10 hover:text-green-600">
                        <Heart className="w-10 h-10 fill-current" />
                    </Button>
                </div>
            )}
        </div>
    );
}

