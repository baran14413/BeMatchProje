'use client';

import React, { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import TinderCard from 'react-tinder-card';
import { Heart, X, Undo, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    []
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
    // Bu fonksiyon, kart tamamen ekrandan çıktığında tetiklenir.
    // Gelecekte burada bir işlem yapmak isterseniz kullanabilirsiniz.
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
    <div className="w-full h-full flex flex-col items-center justify-center pt-4 pb-20">
      <div className="relative w-full max-w-[350px] h-[580px]">
        {db.map((character, index) => (
          <TinderCard
            ref={childRefs[index]}
            className="absolute"
            key={character.name}
            onSwipe={(dir) => swiped(dir, character.name, index)}
            onCardLeftScreen={() => outOfFrame(character.name, index)}
            preventSwipe={['up', 'down']} // Sadece sağa ve sola kaydırmayı etkinleştirir
          >
            <div className="relative w-[350px] h-[580px] rounded-2xl overflow-hidden shadow-2xl bg-card border">
              <Image
                src={character.image}
                alt={character.name}
                layout="fill"
                className="object-cover"
                data-ai-hint={character.aiHint}
                priority
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
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <h3 className="text-xl font-bold">Bugünlük Herkesi Gördün</h3>
            <p className="mt-2">Daha fazla kişi görmek için yarın tekrar gel.</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-6">
        <Button
            onClick={() => swipe('left')}
            variant="outline"
            size="icon"
            className="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-100 hover:text-red-600 disabled:bg-gray-200"
            disabled={!canSwipe}
        >
            <X className="w-8 h-8" />
        </Button>
        <Button
            onClick={() => goBack()}
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-100 hover:text-yellow-600 disabled:bg-gray-200"
            disabled={!canGoBack}
        >
            <Undo className="w-6 h-6" />
        </Button>
        <Button
            onClick={() => swipe('right')}
            variant="outline"
            size="icon"
            className="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-100 hover:text-green-600 disabled:bg-gray-200"
            disabled={!canSwipe}
        >
            <Heart className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
