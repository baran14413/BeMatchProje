'use client';

import React, { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import TinderCard from 'react-tinder-card';
import { Heart, X, Undo, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const db = [
  {
    id: 1,
    name: 'Elif',
    age: 28,
    city: 'İstanbul',
    hobbies: ['Sinema', 'Yoga', 'Seyahat'],
    bio: 'Hayatı keşfetmeyi seven, enerjik biriyim.',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman smiling',
  },
  {
    id: 2,
    name: 'Mehmet',
    age: 32,
    city: 'Ankara',
    hobbies: ['Doğa Yürüyüşü', 'Kitap', 'Müzik'],
    bio: 'Hafta sonları kendimi doğaya atarım.',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait man hiking',
  },
  {
    id: 3,
    name: 'Ayşe',
    age: 25,
    city: 'İzmir',
    hobbies: ['Fotoğrafçılık', 'Dans', 'Hayvanlar'],
    bio: 'Gördüğüm her güzel anı ölümsüzleştirmeye çalışırım.',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman beach',
  },
  {
    id: 4,
    name: 'Can',
    age: 29,
    city: 'İstanbul',
    hobbies: ['Teknoloji', 'Basketbol', 'Yemek'],
    bio: 'Yazılım mühendisiyim ve teknolojiyle iç içeyim.',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait man professional',
  },
  {
    id: 5,
    name: 'Zeynep',
    age: 30,
    city: 'Bursa',
    hobbies: ['Kahve', 'Sanat', 'Tarih'],
    bio: 'Üçüncü nesil kahve dükkanlarını keşfetmeyi severim.',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman drinking coffee',
  },
];

type TinderCardRef = {
  swipe(dir: 'left' | 'right' | 'up' | 'down'): Promise<void>;
  restoreCard(): Promise<void>;
};

export default function MatchPage() {
  const [currentIndex, setCurrentIndex] = useState(db.length - 1);
  const currentIndexRef = useRef(currentIndex);

  const childRefs = useMemo(
    () =>
      Array(db.length)
        .fill(0)
        .map(() => React.createRef<TinderCardRef>()),
    [db.length]
  );

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  const canGoBack = currentIndex < db.length - 1;
  const canSwipe = currentIndex >= 0;

  const swiped = (direction: string, nameToDelete: string, index: number) => {
    updateCurrentIndex(index - 1);
  };

  const outOfFrame = (name: string, idx: number) => {
     // You can handle what happens when a card is swiped out, e.g. a toast message.
  };

  const swipe = async (dir: 'left' | 'right') => {
    if (canSwipe && currentIndex < db.length) {
      await childRefs[currentIndex].current?.swipe(dir);
    }
  };

  const goBack = async () => {
    if (!canGoBack) return;
    const newIndex = currentIndex + 1;
    updateCurrentIndex(newIndex);
    await childRefs[newIndex].current?.restoreCard();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 pb-20 md:pb-4">
      <div className="w-full h-full flex flex-col items-center justify-center flex-grow relative">
        {/* This is the container for the cards */}
        <div className="relative w-full max-w-[350px] h-[580px] flex-shrink-0">
          {db.map((character, index) => (
            <TinderCard
              ref={childRefs[index]}
              className="absolute"
              key={character.name}
              onSwipe={(dir) => swiped(dir, character.name, index)}
              onCardLeftScreen={() => outOfFrame(character.name, index)}
              preventSwipe={['up', 'down']}
            >
              <div className="relative w-[350px] h-[580px] rounded-2xl overflow-hidden shadow-2xl bg-card border">
                <Image
                  src={character.image}
                  alt={character.name}
                  fill
                  className="object-cover"
                  data-ai-hint={character.aiHint}
                  priority={index === db.length - 1}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-3xl font-bold">
                    {character.name}, {character.age}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    <p>{character.city}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {character.hobbies.map((hobby) => (
                      <Badge key={hobby} variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-sm">
                        {hobby}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TinderCard>
          ))}

          {!canSwipe && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground bg-secondary rounded-2xl">
              <h3 className="text-xl font-bold">Bugünlük Herkesi Gördün</h3>
              <p className="mt-2">Daha fazla kişi görmek için yarın tekrar gel.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mt-6 flex-shrink-0">
        <Button
          onClick={() => swipe('left')}
          variant="outline"
          size="icon"
          className="w-20 h-20 rounded-full border-4 shadow-lg bg-white border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:bg-gray-100"
          disabled={!canSwipe}
        >
          <X className="w-10 h-10" />
        </Button>
        <Button
          onClick={() => goBack()}
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-4 shadow-lg bg-white border-yellow-200 text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600 disabled:opacity-50 disabled:bg-gray-100"
          disabled={!canGoBack}
        >
          <Undo className="w-8 h-8" />
        </Button>
        <Button
          onClick={() => swipe('right')}
          variant="outline"
          size="icon"
          className="w-20 h-20 rounded-full border-4 shadow-lg bg-white border-green-200 text-green-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50 disabled:bg-gray-100"
          disabled={!canSwipe}
        >
          <Heart className="w-10 h-10" />
        </Button>
      </div>
    </div>
  );
}
