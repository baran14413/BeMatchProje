'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import TinderCard from 'react-tinder-card';
import { Heart, X, Undo, MapPin, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const db = [
  {
    id: 1,
    name: 'Elif',
    age: 28,
    city: 'İstanbul',
    hobbies: ['Sinema', 'Yoga', 'Seyahat'],
    bio: 'Hayatı keşfetmeyi seven, enerjik biriyim. Yeni yerler görmek, yeni tatlar denemek en büyük tutkum. Birlikte güzel anılar biriktirebileceğim birini arıyorum.',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman smiling',
  },
  {
    id: 2,
    name: 'Mehmet',
    age: 32,
    city: 'Ankara',
    hobbies: ['Doğa Yürüyüşü', 'Kitap', 'Rock Müzik'],
    bio: 'Hafta sonları kendimi doğaya atarım. Sakinliği ve dinginliği severim ama iyi bir konsere de hayır demem. Fikir alışverişi yapabileceğim, uyumlu birini arıyorum.',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait man hiking',
  },
  {
    id: 3,
    name: 'Ayşe',
    age: 25,
    city: 'İzmir',
    hobbies: ['Fotoğrafçılık', 'Dans', 'Hayvanlar'],
    bio: 'Gördüğüm her güzel anı ölümsüzleştirmeye çalışırım. Hayvanlara aşığım ve bir kedim var. Dans etmek ruhumu besliyor!',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman beach',
  },
  {
    id: 4,
    name: 'Can',
    age: 29,
    city: 'İstanbul',
    hobbies: ['Teknoloji', 'Basketbol', 'Yemek Yapmak'],
    bio: 'Yazılım mühendisiyim ve teknolojiyle iç içeyim. Boş zamanlarımda arkadaşlarımla basketbol oynar, yeni yemek tarifleri denerim.',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait man professional',
  },
  {
    id: 5,
    name: 'Zeynep',
    age: 30,
    city: 'Bursa',
    hobbies: ['Kahve', 'Sanat Galerileri', 'Tarih'],
    bio: 'Üçüncü nesil kahve dükkanlarını keşfetmeyi ve sanat galerilerini gezmeyi severim. Tarihi romanlar okumak en büyük zevkim.',
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
  const [lastDirection, setLastDirection] = useState<string | undefined>();
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

  const swiped = (direction: string, name: string, index: number) => {
    setLastDirection(direction);
    updateCurrentIndex(index - 1);
  };

  const outOfFrame = (name: string, idx: number) => {
     // Handle keeping cards in view
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
    <div className="flex flex-col items-center justify-center w-full h-full pt-4 pb-20">
      <div className="relative w-full max-w-[350px] h-[580px] md:max-w-sm md:h-[600px]">
        {db.map((character, index) => (
          <TinderCard
            ref={childRefs[index]}
            className="absolute"
            key={character.id}
            onSwipe={(dir) => swiped(dir, character.name, index)}
            onCardLeftScreen={() => outOfFrame(character.name, index)}
            preventSwipe={['up', 'down']}
          >
            <div className="relative w-[350px] h-[580px] md:w-sm md:h-[600px] rounded-2xl overflow-hidden shadow-2xl bg-card border">
               {/* Swipe Indicator */}
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <div id="swipe-nope-indicator" className="opacity-0">
                      <X className="w-32 h-32 text-red-500/80 transform -rotate-20" strokeWidth={4}/>
                  </div>
                   <div id="swipe-like-indicator" className="opacity-0">
                      <Heart className="w-32 h-32 text-green-400/80 transform rotate-20" strokeWidth={4} fill="currentColor"/>
                  </div>
              </div>
              <Image
                src={character.image}
                alt={character.name}
                fill
                className="object-cover"
                data-ai-hint={character.aiHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="text-3xl font-bold font-headline">
                  {character.name}, {character.age}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    <p>{character.city}</p>
                </div>
                 <div className="flex flex-wrap gap-2 mt-3">
                    {character.hobbies.map(hobby => (
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
                <Button onClick={() => window.location.reload()} className="mt-4">Yenile</Button>
            </div>
        )}
      </div>

       {/* Action Buttons are removed as per request */}

      {/* Undo Button can stay if desired */}
       <div className="flex items-center justify-center mt-4">
            <Button
              onClick={() => goBack()}
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-100 hover:text-yellow-600 disabled:bg-gray-200"
              disabled={!canGoBack}
            >
              <Undo className="w-6 h-6" />
            </Button>
       </div>
    </div>
  );
}

    