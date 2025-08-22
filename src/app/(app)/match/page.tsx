
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Crown, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { cn } from '@/lib/utils';


const UserSkeleton = () => (
    <div className="w-full aspect-[3/4] bg-muted rounded-xl animate-pulse">
        <Skeleton className="w-full h-full" />
    </div>
);

export default function MatchPage() {
  const [users, setUsers] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const usersQuery = query(collection(db, 'users'), where('uid', '!=', currentUser.uid));
        const userSnapshot = await getDocs(usersQuery);
        const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  return (
    <div className="container mx-auto p-4">
        {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <UserSkeleton key={i} />)}
            </div>
        ) : users.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {users.map((user) => (
                <Link href={`/profile/${user.id}`} key={user.id} className="block group">
                    <Card className="w-full aspect-[3/4] rounded-xl overflow-hidden relative border-none shadow-lg transition-transform duration-300 ease-in-out group-hover:scale-105">
                        <Image
                            src={user.avatarUrl || 'https://placehold.co/400x533.png'}
                            alt={user.name}
                            fill
                            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                            data-ai-hint={user.aiHint || 'portrait'}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                             <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-bold truncate">{user.name}</h3>
                                {user.age && <p className="text-lg">{user.age}</p>}
                             </div>
                             <div className="flex items-center gap-1.5 mt-1 text-sm opacity-80">
                                {user.isPremium && <Crown className="w-4 h-4 text-yellow-400" />}
                                {user.city && <p className="truncate">{user.city}</p>}
                             </div>
                        </div>
                    </Card>
                </Link>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center text-muted-foreground">
                <h3 className="text-xl font-bold">Görünüşe Göre Etrafta Kimse Kalmadı</h3>
                <p className="mt-2 text-sm">Daha fazla kişi görmek için daha sonra tekrar kontrol et.</p>
            </div>
        )}
    </div>
  );
}
