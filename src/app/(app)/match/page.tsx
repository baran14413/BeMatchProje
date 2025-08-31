
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, MessageCircle } from 'lucide-react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserProfile = {
  uid: string;
  name: string;
  username: string;
  age: number;
  bio: string;
  avatarUrl: string;
  hobbies: string[];
};

const UserCardSkeleton = () => (
    <Card className="w-full">
         <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-40" />
            </div>
             <div className="flex flex-col gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
            </div>
         </CardContent>
    </Card>
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
                age: data.age || '?',
                bio: data.bio || '',
                avatarUrl: data.avatarUrl || 'https://placehold.co/600x800.png',
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
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
       <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                Yeni Kişileri Keşfet
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Aramıza yeni katılan veya sana uygun olabileceğini düşündüğümüz profiller.
            </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {loading && Array.from({length: 5}).map((_, i) => <UserCardSkeleton key={i} />)}
            
            {!loading && users.length === 0 && (
                 <div className="col-span-full text-center text-muted-foreground py-20">
                    <p className="text-lg font-semibold">Görünüşe göre şimdilik herkesle ilgilendin!</p>
                    <p className="text-sm">Daha sonra yeni kişileri görmek için tekrar kontrol et.</p>
                </div>
            )}

            {!loading && users.map((user) => (
                 <Card key={user.uid} className="w-full">
                    <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className='w-20 h-20'>
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold text-lg truncate">{user.name.split(' ')[0]}</h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
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
                    </CardContent>
                 </Card>
            ))}
        </div>
    </div>
  );
}
