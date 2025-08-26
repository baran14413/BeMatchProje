
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Crown, Loader2, User } from 'lucide-react';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { cn } from '@/lib/utils';


const UserSkeleton = () => (
    <div className="w-full aspect-[3/4] bg-muted rounded-xl">
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
    <div className="container mx-auto p-2 sm:p-4">
        {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                {[...Array(8)].map((_, i) => <UserSkeleton key={i} />)}
            </div>
        ) : users.length > 0 ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                {users.map((user) => (
                <Link href={`/profile/${user.username}`} key={user.id} className="block group">
                    <Card className="w-full aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-primary">
                       <CardContent className="p-0 h-full w-full relative">
                            {user.avatarUrl ? (
                                <Image
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={user.aiHint || 'portrait'}
                                />
                            ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center">
                                    <User className="w-1/2 h-1/2 text-muted-foreground"/>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                 <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold truncate">{user.name}</h3>
                                    {user.age && <p className="text-base text-white/80">{user.age}</p>}
                                 </div>
                                 <p className="text-xs text-white/70 truncate">@{user.username}</p>
                                 
                                 <div className="flex items-center gap-4 mt-2">
                                    {user.isPremium && <Badge className="bg-yellow-500/20 text-yellow-300 border-none backdrop-blur-sm p-1 px-2 text-xs"><Crown className="w-3 h-3 mr-1"/>Premium</Badge>}
                                    {user.isOnline && <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-none backdrop-blur-sm p-1 px-2 text-xs"><div className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></div>Aktif</Badge>}
                                 </div>
                            </div>
                       </CardContent>
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
