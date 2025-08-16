
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Crown, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const UserSkeleton = () => (
  <div className="p-4 flex items-center gap-4 border-b">
    <Skeleton className="w-16 h-16 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

export default function MatchPage() {
  const [users, setUsers] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold px-4 pt-4 pb-2 font-headline">Sana Uygun Kişiler</h1>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {loading ? (
            <>
              <UserSkeleton />
              <UserSkeleton />
              <UserSkeleton />
              <UserSkeleton />
            </>
          ) : users.length > 0 ? (
            users.map((user) => (
              <Link href={`/profile/${user.id}`} key={user.id} className="block hover:bg-muted/50 transition-colors">
                <div className="p-4 flex items-center gap-4 border-b">
                  <Avatar className="w-16 h-16 border">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.aiHint} />
                    <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-bold">{user.name},</h3>
                        <p className="text-lg text-muted-foreground">{user.age}</p>
                      </div>
                      {user.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                     <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <p className="text-sm">{user.city}</p>
                     </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10">
              <h3 className="text-xl font-bold">Görünüşe Göre Etrafta Kimse Kalmadı</h3>
              <p className="mt-2">Daha fazla kişi görmek için daha sonra tekrar kontrol et.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
