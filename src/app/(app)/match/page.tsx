'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Heart, Undo2, Star, Info, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  {
    id: 3,
    name: 'Ayşe',
    age: 25,
    distance: 'Yakınında',
    bio: 'Sanat galerilerini gezmekten ve yeni yerler keşfetmekten hoşlanırım.',
    interests: ['Sanat', 'Yemek', 'Müzik', 'Dans'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'person painting colorful',
  },
  {
    id: 4,
    name: 'Burak',
    age: 30,
    distance: '10 km uzakta',
    bio: 'Maceraperest bir ruh. Adrenalin dolu aktiviteleri severim.',
    interests: ['Macera', 'Spor', 'Dalış', 'Motor'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'man skydiving smiling',
  },
];

export default function MatchPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentUser = mockUsers[currentIndex];

    const handleSwipe = (action: 'like' | 'dislike') => {
        // Here you would add logic to handle the like/dislike action
        console.log(`Swiped ${action} on ${currentUser.name}`);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % mockUsers.length);
    };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 md:pl-24 h-full">
      <div className="w-full max-w-sm mx-auto">
        <Card className="relative w-full aspect-[3/4.5] rounded-3xl overflow-hidden shadow-2xl group transition-all duration-300 ease-in-out">
            <Image
                key={currentUser.id}
                src={currentUser.image}
                alt={currentUser.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                data-ai-hint={currentUser.aiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full p-6 text-white flex flex-col gap-4">
                <div>
                    <h2 className="text-4xl font-bold font-headline drop-shadow-lg">{currentUser.name}, {currentUser.age}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-white/80"/>
                        <p className="text-sm text-white/80 font-medium drop-shadow-md">{currentUser.distance}</p>
                    </div>
                </div>
                
                <p className="text-white/90 text-base leading-relaxed line-clamp-2">{currentUser.bio}</p>

                <div className="flex flex-wrap gap-2">
                    {currentUser.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-sm text-xs">
                            {interest}
                        </Badge>
                    ))}
                </div>
            </div>
            <Button size="icon" variant="ghost" className="absolute top-4 right-4 h-10 w-10 text-white hover:bg-white/20">
                <Info className="h-6 w-6"/>
            </Button>
        </Card>

        <div className="flex items-center justify-center gap-4 mt-8">
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-white shadow-lg border-gray-200 text-yellow-500 hover:bg-yellow-500/10" onClick={() => console.log('Undo')}>
                <Undo2 className="h-8 w-8" />
            </Button>
            <Button variant="outline" size="icon" className="w-20 h-20 rounded-full bg-white shadow-lg border-gray-200 text-red-500 hover:bg-red-500/10" onClick={() => handleSwipe('dislike')}>
                <X className="h-10 w-10" />
            </Button>
            <Button variant="outline" size="icon" className="w-20 h-20 rounded-full bg-white shadow-lg border-gray-200 text-green-500 hover:bg-green-500/10" onClick={() => handleSwipe('like')}>
                <Heart className="h-10 w-10" />
            </Button>
             <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-white shadow-lg border-gray-200 text-blue-500 hover:bg-blue-500/10" onClick={() => console.log('Superlike')}>
                <Star className="h-8 w-8" />
            </Button>
        </div>
      </div>
    </div>
  );
}
