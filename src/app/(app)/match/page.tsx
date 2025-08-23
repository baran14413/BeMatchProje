
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const UserSkeleton = () => (
    <div className="flex items-center gap-4 p-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
        </div>
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
    <div className="container mx-auto p-4 max-w-2xl">
        {loading ? (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => <UserSkeleton key={i} />)}
            </div>
        ) : users.length > 0 ? (
             <div className="flex flex-col gap-3">
                {users.map((user) => (
                <Link href={`/profile/${user.id}`} key={user.id} className="block group">
                    <Card className="w-full rounded-xl overflow-hidden transition-all duration-200 ease-in-out hover:bg-muted/50 hover:shadow-md">
                        <div className="flex items-center p-4 gap-4">
                            <Avatar className="w-16 h-16 border-2 border-primary/50">
                                <AvatarImage src={user.avatarUrl || ''} alt={user.name} data-ai-hint={user.aiHint || 'portrait'} />
                                <AvatarFallback className="text-xl">
                                    {user.name ? user.name.charAt(0) : <User/>}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                 <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold truncate">{user.name}</h3>
                                    {user.age && <p className="text-base text-muted-foreground">{user.age}</p>}
                                 </div>
                                 <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                                 <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    {user.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                                    {user.city && <p className="truncate">{user.city}</p>}
                                 </div>
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
