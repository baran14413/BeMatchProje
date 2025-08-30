
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Crown, Loader2, User, Heart } from 'lucide-react';
import { collection, query, where, getDocs, DocumentData, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';


const UserSkeleton = () => (
    <div className="w-full aspect-[3/4] bg-muted rounded-xl">
        <Skeleton className="w-full h-full" />
    </div>
);

export default function MatchPage() {
  const [users, setUsers] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const [previewUser, setPreviewUser] = useState<DocumentData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch current user's profile to get their criteria
        const currentUserDocRef = doc(db, 'users', currentUser.uid);
        const currentUserDocSnap = await getDoc(currentUserDocRef);
        
        if (!currentUserDocSnap.exists()) {
            console.error("Current user profile not found!");
            setLoading(false);
            return;
        }

        const currentUserData = currentUserDocSnap.data();
        const userAge = currentUserData.age;
        const userGender = currentUserData.gender;
        const userCity = currentUserData.city;

        if (!userAge || !userGender || !userCity) {
            console.error("Current user's age, gender, or city is missing.");
            setUsers([]);
            setLoading(false);
            return;
        }

        // 2. Define the filtering logic
        const targetGender = userGender === 'male' ? 'female' : 'male';
        const minAge = parseInt(userAge) - 2;
        const maxAge = parseInt(userAge) + 5;
        
        // 3. Construct a simpler query
        const usersQuery = query(
            collection(db, 'users'), 
            where('gender', '==', targetGender),
            where('city', '==', userCity)
        );

        const userSnapshot = await getDocs(usersQuery);
        
        // 4. Filter the remaining logic in the client
        const userList = userSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => {
                const age = parseInt(user.age);
                return user.id !== currentUser.uid && age >= minAge && age <= maxAge;
            });
        
        setUsers(userList);

      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const getGradientForUser = (userId: string) => {
    const gradients = [
      'from-pink-500 to-yellow-500',
      'from-purple-500 to-indigo-500',
      'from-green-400 to-blue-500',
      'from-red-500 to-orange-500',
    ];
    const index = userId.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <Sheet onOpenChange={(open) => !open && setPreviewUser(null)}>
        <div className="container mx-auto p-2 sm:p-4">
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {[...Array(10)].map((_, i) => <UserSkeleton key={i} />)}
                </div>
            ) : users.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {users.map((user) => (
                    <SheetTrigger asChild key={user.id} onClick={() => setPreviewUser(user)}>
                        <div className="block group">
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
                                        <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", getGradientForUser(user.id))}>
                                            <Heart className="w-1/2 h-1/2 text-white/50"/>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold truncate">{user.name}</h3>
                                            {user.age && <p className="text-base text-white/80">{user.age}</p>}
                                        </div>
                                         {user.city && (
                                            <div className="flex items-center gap-1 text-xs text-white/70 mt-1">
                                                <MapPin className="w-3 h-3"/>
                                                <p className="truncate">{user.city}</p>
                                            </div>
                                         )}
                                        
                                        <div className="flex items-center gap-4 mt-2">
                                            {user.isPremium && <Badge className="bg-yellow-500/20 text-yellow-300 border-none backdrop-blur-sm p-1 px-2 text-xs"><Crown className="w-3 h-3 mr-1"/>Premium</Badge>}
                                        </div>
                                    </div>
                            </CardContent>
                            </Card>
                        </div>
                    </SheetTrigger>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[70vh] text-center text-muted-foreground">
                    <h3 className="text-xl font-bold">Görünüşe Göre Etrafta Kimse Kalmadı</h3>
                    <p className="mt-2 text-sm">Filtrelerinize uyan kimseyi bulamadık. Daha sonra tekrar kontrol edin.</p>
                </div>
            )}
        </div>

        <SheetContent side="bottom" className="rounded-t-xl h-auto max-h-[85vh] flex flex-col p-0">
             {previewUser && (
                <>
                <SheetHeader className="p-6 pb-0 text-left">
                     <div className="flex items-center gap-4">
                         <Avatar className="w-20 h-20 border-2">
                            {previewUser.avatarUrl ? (
                                <AvatarImage src={previewUser.avatarUrl} alt={previewUser.name} />
                            ) : (
                                <AvatarFallback className={cn("bg-gradient-to-br", getGradientForUser(previewUser.id))}>
                                    <Heart className="w-10 h-10 text-white/70" />
                                </AvatarFallback>
                            )}
                         </Avatar>
                         <div className="flex-1">
                             <SheetTitle className="text-2xl font-bold">{previewUser.name}</SheetTitle>
                             <SheetDescription>@{previewUser.username}</SheetDescription>
                         </div>
                     </div>
                      <p className="text-sm text-muted-foreground pt-4">{previewUser.bio || "Henüz bir biyografi eklenmemiş."}</p>
                </SheetHeader>
                 <Separator className="my-4"/>
                <SheetFooter className="p-6 pt-0 flex-col sm:flex-col sm:justify-start gap-3">
                   <SheetClose asChild>
                     <Link href={`/profile/${previewUser.username}`} className='w-full'>
                         <Button className="w-full">Profili Gör</Button>
                     </Link>
                   </SheetClose>
                   <SheetClose asChild>
                     <Link href={`/chat?userId=${previewUser.uid}`} className='w-full'>
                         <Button className="w-full" variant="outline">
                             <MessageSquare className="mr-2 h-4 w-4"/> Mesaj Gönder
                         </Button>
                     </Link>
                   </SheetClose>
                </SheetFooter>
                </>
             )}
        </SheetContent>
    </Sheet>
  );
}
