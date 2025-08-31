
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, MessageCircle } from 'lucide-react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

type UserProfile = {
  uid: string;
  name: string;
  username: string;
  avatarUrl: string;
  hobbies: string[];
};

const UserRowSkeleton = () => (
    <div className="flex items-center gap-4 p-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
        </div>
    </div>
);

export default function MatchPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
          setLoading(false);
          return;
      }
      setLoading(true);
      try {
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
                username: data.username || 'kullanici',
                avatarUrl: data.avatarUrl || 'https://placehold.co/128x128.png',
                hobbies: data.hobbies || []
            }
        }) as UserProfile[];
        
        setUsers(fetchedUsers.sort(() => Math.random() - 0.5));

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


  return (
    <div className="w-full">
        <div className="flex flex-col">
            {loading && Array.from({length: 8}).map((_, i) => <UserRowSkeleton key={i} />)}
            
            {!loading && users.length === 0 && (
                 <div className="col-span-full text-center text-muted-foreground py-20">
                    <p className="text-lg font-semibold">Görünüşe göre şimdilik herkesle ilgilendin!</p>
                    <p className="text-sm">Daha sonra yeni kişileri görmek için tekrar kontrol et.</p>
                </div>
            )}

            {!loading && users.map((user) => (
                 <div key={user.uid} className="flex items-center gap-4 p-4 border-b">
                    <Avatar className='w-16 h-16'>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <h3 className="font-bold text-lg truncate">{user.name.split(' ')[0]}</h3>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                         <div className="flex flex-wrap gap-1 mt-2">
                            {user.hobbies.map((hobby) => (
                                <Badge key={hobby} variant="secondary">{hobby}</Badge>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                       <Link href={`/chat?userId=${user.uid}`}>
                            <Button size="sm" className="w-full">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Mesaj
                            </Button>
                        </Link>
                         <Link href={`/profile/${user.username}`}>
                            <Button size="sm" variant="outline" className="w-full">
                                <User className="mr-2 h-4 w-4" />
                                Profil
                            </Button>
                        </Link>
                    </div>
                 </div>
            ))}
        </div>
    </div>
  );
}
