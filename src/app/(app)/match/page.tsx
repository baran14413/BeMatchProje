
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Crown, Loader2, User, Heart, Filter } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { MultiSelect } from '@/components/ui/multi-select';
import { cities } from '@/config/turkey-locations';

const UserSkeleton = () => (
    <div className="w-full aspect-[3/4] bg-muted rounded-xl">
        <Skeleton className="w-full h-full" />
    </div>
);

type Filters = {
  gender: 'male' | 'female' | 'all';
  ageRange: [number, number];
  cities: string[];
};

export default function MatchPage() {
  const [allUsers, setAllUsers] = useState<DocumentData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    gender: 'all',
    ageRange: [18, 65],
    cities: []
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const usersQuery = query(
          collection(db, 'users'), 
          where('uid', '!=', currentUser.uid)
        );
        const userSnapshot = await getDocs(usersQuery);
        const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(userList);
        setFilteredUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);
  
  const applyFilters = () => {
      let usersToFilter = [...allUsers];

      // Gender filter
      if (filters.gender !== 'all') {
          usersToFilter = usersToFilter.filter(user => user.gender === filters.gender);
      }
      
      // Age range filter
      usersToFilter = usersToFilter.filter(user => {
          const age = parseInt(user.age);
          return age >= filters.ageRange[0] && age <= filters.ageRange[1];
      });

      // City filter
      if (filters.cities.length > 0) {
          usersToFilter = usersToFilter.filter(user => filters.cities.includes(user.city));
      }
      
      setFilteredUsers(usersToFilter);
      setIsFilterSheetOpen(false);
  };
  
  const clearFilters = () => {
      setFilters({
          gender: 'all',
          ageRange: [18, 65],
          cities: []
      });
      setFilteredUsers(allUsers);
      setIsFilterSheetOpen(false);
  };


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

  const cityOptions = useMemo(() => cities.map(city => ({ value: city.name, label: city.name })), []);

  return (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <div className="container mx-auto p-2 sm:p-4">
            <header className="flex items-center justify-between mb-4 px-2">
                <h1 className="text-2xl font-bold font-headline">Keşfet</h1>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Filter className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
            </header>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {[...Array(10)].map((_, i) => <UserSkeleton key={i} />)}
                </div>
            ) : filteredUsers.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {filteredUsers.map((user) => (
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
                    </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[70vh] text-center text-muted-foreground">
                    <h3 className="text-xl font-bold">Sonuç Bulunamadı</h3>
                    <p className="mt-2 text-sm max-w-xs">Filtrelerinize uyan kimseyi bulamadık. Filtreleri genişletmeyi veya temizlemeyi deneyin.</p>
                     <Button variant="outline" className="mt-4" onClick={clearFilters}>Filtreyi Temizle</Button>
                </div>
            )}
        </div>

        <SheetContent side="bottom" className="rounded-t-xl h-auto max-h-[85vh] flex flex-col p-6">
             <SheetHeader className="text-left">
                 <SheetTitle className="text-2xl">Filtrele</SheetTitle>
                 <SheetDescription>Arama kriterlerinizi belirleyerek size en uygun kişileri bulun.</SheetDescription>
             </SheetHeader>
             <div className="flex-1 space-y-6 overflow-y-auto py-4">
                <div>
                    <Label className="font-semibold">Cinsiyet</Label>
                    <RadioGroup 
                        value={filters.gender}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value as 'male' | 'female' | 'all' }))} 
                        className="flex gap-4 mt-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female">Kadın</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male">Erkek</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="all" />
                            <Label htmlFor="all">Tümü</Label>
                        </div>
                    </RadioGroup>
                </div>
                 <div>
                    <Label htmlFor="ageRange" className="font-semibold">Yaş Aralığı: <span className="text-primary font-bold">{filters.ageRange[0]} - {filters.ageRange[1]}</span></Label>
                     <Slider
                        id="ageRange"
                        value={filters.ageRange}
                        min={18}
                        max={65}
                        step={1}
                        minStepsBetweenThumbs={1}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value as [number, number] }))}
                        className="mt-4"
                    />
                </div>
                <div>
                    <Label className="font-semibold">Şehir</Label>
                    <MultiSelect
                        options={cityOptions}
                        selected={filters.cities}
                        onChange={(selected) => setFilters(prev => ({...prev, cities: selected}))}
                        placeholder="Bir veya daha fazla şehir seçin..."
                        className="mt-2"
                    />
                </div>
             </div>
             <SheetFooter className="pt-4 flex-row sm:flex-row sm:justify-between gap-2">
                <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">Filtreyi Temizle</Button>
                <Button onClick={applyFilters} className="w-full sm:w-auto">Filtreleri Uygula</Button>
             </SheetFooter>
        </SheetContent>
    </Sheet>
  );
}
