'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Heart, Star, Zap } from 'lucide-react';

const mockUsers = [
  {
    id: 1,
    name: 'Elif, 28',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman smiling',
  },
  {
    id: 2,
    name: 'Mehmet, 32',
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
    <div className="flex flex-col items-center justify-center h-full p-4 relative overflow-hidden pb-28 md:pb-4">
        <Card className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg">
            <div className="relative w-full aspect-[3/4.5]">
                <Image
                    key={currentUser.id}
                    src={currentUser.image}
                    alt={currentUser.name}
                    fill
                    className="object-cover"
                    data-ai-hint={currentUser.aiHint}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h2 className="text-3xl font-bold text-white font-headline">{currentUser.name}</h2>
                </div>
            </div>
        </Card>

        <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-white shadow-lg text-red-500 border-gray-200 hover:bg-red-50" onClick={() => handleSwipe('dislike')}>
                <X className="w-8 h-8" />
            </Button>
             <Button variant="outline" size="icon" className="w-20 h-20 rounded-full bg-white shadow-xl text-green-500 border-gray-200 hover:bg-green-50">
                <Heart className="w-10 h-10" />
            </Button>
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full bg-white shadow-lg text-blue-500 border-gray-200 hover:bg-blue-50">
                <Star className="w-8 h-8" />
            </Button>
        </div>
    </div>
  );
}
