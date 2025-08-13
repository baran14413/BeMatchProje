'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { X, Heart, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockUsers = [
  {
    id: 1,
    name: 'Elif, 28',
    bio: 'Kahve ve seyahat tutkunu. Yeni yerler keşfetmeyi ve iyi bir kitapla kaybolmayı seviyorum.',
    interests: ['Seyahat', 'Okuma', 'Kahve', 'Yoga'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman',
  },
  {
    id: 2,
    name: 'Mehmet, 32',
    bio: 'Hafta sonları dağlarda yürüyüş yapmayı, hafta içleri ise kod yazmayı seven bir mühendis.',
    interests: ['Yürüyüş', 'Teknoloji', 'Film', 'Fitness'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait man',
  },
  {
    id: 3,
    name: 'Ayşe, 25',
    bio: 'Sanat galerilerini gezmekten ve yeni tarifler denemekten hoşlanan bir sanatçı.',
    interests: ['Sanat', 'Yemek', 'Müzik', 'Dans'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'person painting',
  },
  {
    id: 4,
    name: 'Burak, 30',
    bio: 'Maceraperest bir ruh. Paraşütle atlama ve dalış en büyük hobilerim.',
    interests: ['Macera', 'Spor', 'Dalış', 'Seyahat'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'man skydiving',
  },
];

export default function MatchPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleInteraction = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % mockUsers.length);
  };

  const handleUndo = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : mockUsers.length - 1));
  };
  
  const user = mockUsers[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
      <div className="relative w-full max-w-sm mx-auto">
        <Card className="overflow-hidden rounded-2xl shadow-2xl">
          <CardContent className="p-0">
            <div className="relative aspect-[3/4]">
              <Image
                src={user.image}
                alt={user.name}
                fill
                className="object-cover"
                data-ai-hint={user.aiHint}
              />
              <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
                <h2 className="text-3xl font-bold text-white font-headline">{user.name}</h2>
                <p className="text-white/90 mt-1">{user.bio}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                    {user.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-sm">
                            {interest}
                        </Badge>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center justify-center gap-4 mt-8">
        <Button
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-2 border-amber-500 text-amber-500 hover:bg-amber-100 hover:text-amber-600 shadow-lg"
          onClick={handleInteraction}
        >
          <X className="h-8 w-8" />
        </Button>
         <Button
          variant="outline"
          size="icon"
          className="w-14 h-14 rounded-full border-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 shadow-md"
          onClick={handleUndo}
        >
          <Undo2 className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-100 hover:text-green-600 shadow-lg"
          onClick={handleInteraction}
        >
          <Heart className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
