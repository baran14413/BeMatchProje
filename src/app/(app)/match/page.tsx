
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
        <Skeleton className="w-full aspect-[3/4]"/>
        <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
             <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
            </div>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </CardFooter>
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
                username: data.username || 'kullanici',
                age: data.age || '?',
                bio: data.bio || '',
                avatarUrl: data.avatarUrl || 'https://placehold.co/600x800.png',
                hobbies: data.hobbies || []
            }
        }) as UserProfile[];
        
        // Shuffle users for variety
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
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
       <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                Yeni Kişileri Keşfet
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Aramıza yeni katılan veya sana uygun olabileceğini düşündüğümüz profiller.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading && Array.from({length: 8}).map((_, i) => <UserCardSkeleton key={i} />)}
            
            {!loading && users.length === 0 && (
                 <div className="col-span-full text-center text-muted-foreground py-20">
                    <p className="text-lg font-semibold">Görünüşe göre şimdilik herkesle ilgilendin!</p>
                    <p className="text-sm">Daha sonra yeni kişileri görmek için tekrar kontrol et.</p>
                </div>
            )}

            {!loading && users.map((user) => (
                 <Card key={user.uid} className="overflow-hidden flex flex-col group">
                    <div className="relative w-full aspect-[3/4] overflow-hidden">
                        <Image
                            src={user.avatarUrl}
                            alt={user.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>
                     <CardHeader>
                        <CardTitle className="truncate">{user.name}, {user.age}</CardTitle>
                        <CardDescription className="line-clamp-2 h-[40px]">{user.bio}</CardDescription>
                    </CardHeader>
                     <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-2">
                            {user.hobbies.slice(0, 3).map(hobby => (
                                <Badge key={hobby} variant="secondary" className="text-xs">
                                    {hobby}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-2 mt-auto">
                        <Link href={`/profile/${user.username}`}>
                            <Button variant="outline" className="w-full">
                                <User className="mr-2 h-4 w-4" />
                                Profil
                            </Button>
                        </Link>
                         <Link href={`/chat?userId=${user.uid}`}>
                            <Button className="w-full">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Mesaj
                            </Button>
                        </Link>
                    </CardFooter>
                 </Card>
            ))}
        </div>
    </div>
  );
}
