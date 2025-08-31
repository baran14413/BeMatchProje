
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import { Button } from '@/components/ui/button';
import { X, Heart, Sparkles } from 'lucide-react';
import { collection, getDocs, query, where, limit, DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

type UserProfile = {
  uid: string;
  name: string;
  age: number;
  bio: string;
  avatarUrl: string;
  hobbies: string[];
};

const UserCardSkeleton = () => (
    <div className="relative w-full max-w-sm h-[60vh] rounded-2xl bg-muted shadow-lg overflow-hidden">
        <Skeleton className="w-full h-full"/>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    </div>
);

export default function MatchPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
          setLoading(false);
          return;
      }
      setLoading(true);
      try {
        // In a real app, you'd have more complex logic to exclude users you've already interacted with.
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', '!=', currentUser.uid),
          limit(20)
        );
        const querySnapshot = await getDocs(usersQuery);
        const fetchedUsers = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.name || 'Bilinmiyor',
                age: data.age || '?',
                bio: data.bio || '',
                avatarUrl: data.avatarUrl || 'https://placehold.co/600x800.png',
                hobbies: data.hobbies || []
            }
        }) as UserProfile[];
        
        // Shuffle users for variety
        setUsers(fetchedUsers.sort(() => Math.random() - 0.5));
        setCurrentIndex(fetchedUsers.length -1);

      } catch (error) {
        console.error("Error fetching users for matching:", error);
        toast({
          variant: "destructive",
          title: "Kullanıcılar alınamadı",
          description: "Eşleşecek kullanıcıları alırken bir sorun oluştu."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, toast]);

  const swiped = (direction: string, uid: string) => {
    console.log('removing: ' + uid);
    if (direction === 'right') {
        // Handle like logic here (e.g., write to a 'likes' subcollection)
        toast({ title: 'Beğenildi!', className: 'bg-green-500 text-white' });
    }
  };

  const outOfFrame = (name: string) => {
    console.log(name + ' left the screen!');
  };
  
  const childRefs = useMemo(() => Array(users.length).fill(0).map(i => React.createRef<any>()), [users.length]);

  const swipe = async (dir: 'left' | 'right') => {
      if (currentIndex < users.length) {
        await childRefs[currentIndex].current.swipe(dir)
      }
  }


  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
      
      <div className="relative w-full max-w-sm h-[70vh] flex flex-col items-center justify-center">
        {loading && <UserCardSkeleton />}
        {!loading && users.length === 0 && (
             <div className="text-center text-muted-foreground p-10">
                <p className="text-lg font-semibold">Görünüşe göre şimdilik herkesle ilgilendin!</p>
                <p className="text-sm">Daha sonra yeni kişileri görmek için tekrar kontrol et.</p>
            </div>
        )}
        
        {users.map((user, index) => (
          <TinderCard
            ref={childRefs[index]}
            className="absolute"
            key={user.uid}
            onSwipe={(dir) => swiped(dir, user.uid)}
            onCardLeftScreen={() => outOfFrame(user.name)}
            preventSwipe={['up', 'down']}
          >
            <div className="relative w-full max-w-sm h-[60vh] rounded-2xl bg-card shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing">
              <Image
                src={user.avatarUrl}
                alt={user.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-left">
                <h3 className="text-3xl font-bold">{user.name}, {user.age}</h3>
                <p className="text-base opacity-90 mt-1 line-clamp-2">{user.bio}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                    {user.hobbies.slice(0, 3).map(hobby => (
                        <div key={hobby} className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                            {hobby}
                        </div>
                    ))}
                </div>
              </div>
            </div>
          </TinderCard>
        ))}

        <div className="absolute -bottom-10 flex items-center justify-center gap-8">
            <Button className="rounded-full w-20 h-20 bg-white shadow-2xl hover:bg-red-100" size="icon" onClick={() => swipe('left')}>
                <X className="w-10 h-10 text-red-500" />
            </Button>
            <Button className="rounded-full w-16 h-16 bg-white shadow-2xl hover:bg-blue-100" size="icon">
                 <Sparkles className="w-8 h-8 text-blue-500" />
            </Button>
            <Button className="rounded-full w-20 h-20 bg-white shadow-2xl hover:bg-green-100" size="icon" onClick={() => swipe('right')}>
                 <Heart className="w-10 h-10 text-green-500" fill="currentColor"/>
            </Button>
        </div>

      </div>
    </div>
  );
}
