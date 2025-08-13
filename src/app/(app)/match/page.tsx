'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Heart, Star, Zap, Info } from 'lucide-react';

const mockUsers = [
  {
    id: 1,
    name: 'Elif',
    age: 28,
    distance: '2 km uzakta',
    bio: 'Kahve ve seyahat tutkunu. İstanbul\'un altını üstüne getirecek bir partner arıyorum.',
    interests: ['Seyahat', 'Okuma', 'Kahve', 'Sanat'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman smiling',
  },
  {
    id: 2,
    name: 'Mehmet',
    age: 32,
    distance: '5 km uzakta',
    bio: 'Hafta sonları dağlarda yürüyüş yapmayı severim. Doğayı ve macerayı seven birini arıyorum.',
    interests: ['Yürüyüş', 'Teknoloji', 'Film', 'Kamp'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait man hiking',
  },
];

export default function MatchPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentUser = mockUsers[currentIndex];

    const handleSwipe = (action: 'like' | 'dislike') => {
        console.log(`Swiped ${action} on ${currentUser.name}`);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % mockUsers.length);
    };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 relative overflow-hidden">
        <div className="w-full max-w-sm flex flex-col justify-end h-full">
            <h1 className="text-5xl font-headline text-foreground font-bold absolute top-4 left-4 z-20">
                {currentUser.name}, {currentUser.age}
            </h1>
            <Button size="icon" variant="ghost" className="absolute top-4 right-4 z-20 h-10 w-10 text-white hover:bg-white/20">
                <X className="h-6 w-6"/>
            </Button>
            
            <div className="relative w-full aspect-[3/4.5] rounded-3xl overflow-hidden shadow-lg group">
                <Image
                    key={currentUser.id}
                    src={currentUser.image}
                    alt={currentUser.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    data-ai-hint={currentUser.aiHint}
                />
            </div>

            <div className="relative mt-[-80px] z-10">
                <Card className="w-full rounded-2xl shadow-xl p-6">
                    <CardContent className="p-0 flex flex-col gap-4">
                        <div>
                            <h3 className="font-semibold text-lg text-foreground">Burada olma sebebim</h3>
                            <p className="text-muted-foreground text-base mt-1 line-clamp-2">{currentUser.bio}</p>
                        </div>
                         <div className="flex items-center justify-around gap-4 mt-2">
                            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-white shadow-lg text-orange-500 border-none">
                                <Zap className="h-8 w-8" />
                            </Button>
                            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-black text-yellow-400 shadow-lg border-none" onClick={() => handleSwipe('dislike')}>
                                <X className="h-8 w-8" />
                            </Button>
                            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-black text-pink-500 shadow-lg border-none" onClick={() => handleSwipe('like')}>
                                <Heart className="h-8 w-8" />
                            </Button>
                            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-blue-100 text-blue-500 shadow-lg border-none">
                                <Star className="h-8 w-8" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
