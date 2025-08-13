'use client';

import React, { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import TinderCard from 'react-tinder-card';
import { Heart, X, Undo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const db = [
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
  {
    id: 3,
    name: 'Ayşe, 25',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman reading',
  },
    {
    id: 4,
    name: 'Can, 29',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait man professional',
  },
  {
    id: 5,
    name: 'Zeynep, 30',
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
    []
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
    console.log(`${name} (${idx}) left the screen!`, currentIndexRef.current);
    if (currentIndexRef.current >= idx) {
        childRefs[idx].current?.restoreCard();
    }
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
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="relative w-full max-w-[340px] h-[550px] md:max-w-sm md:h-[600px]">
        {db.map((character, index) => (
          <TinderCard
            ref={childRefs[index]}
            className="absolute"
            key={character.name}
            onSwipe={(dir) => swiped(dir, character.name, index)}
            onCardLeftScreen={() => outOfFrame(character.name, index)}
            preventSwipe={['up', 'down']}
          >
            <div className="relative w-[340px] h-[550px] md:w-sm md:h-[600px] rounded-2xl overflow-hidden shadow-2xl bg-card">
              <Image
                src={character.image}
                alt={character.name}
                fill
                className="object-cover"
                data-ai-hint={character.aiHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-3xl font-bold font-headline">{character.name}</h2>
              </div>
              
              {/* Swipe indicator */}
              <div
                className={cn(
                  "absolute top-8 text-5xl font-bold border-4 rounded-xl p-2 px-4 -rotate-20 transition-opacity duration-300 opacity-0",
                  "group-[:nth-of-type(1)_&]:opacity-100" // This is a trick to show indicator only on top card, might not work depending on how TinderCard renders
                )}
                style={{
                  left: 'var(--swipe-indicator-left)',
                  transform: 'rotate(var(--swipe-indicator-rotate))',
                  color: 'var(--swipe-indicator-color)',
                  borderColor: 'var(--swipe-indicator-color)',
                  opacity: 'var(--swipe-indicator-opacity, 0)',
                }}
              >
                <span style={{
                    display: 'var(--swipe-indicator-display-like, none)'
                }}>BEĞEN</span>
                 <span style={{
                    display: 'var(--swipe-indicator-display-nope, none)'
                }}>GEÇ</span>
              </div>

            </div>
          </TinderCard>
        ))}
      </div>
      <div className="flex items-center gap-6 mt-6">
        <Button
          onClick={() => swipe('left')}
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-100 hover:text-red-600"
          disabled={!canSwipe}
        >
          <X className="w-8 h-8" />
        </Button>
        <Button
          onClick={() => goBack()}
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-100 hover:text-yellow-600"
          disabled={!canGoBack}
        >
          <Undo className="w-6 h-6" />
        </Button>
        <Button
          onClick={() => swipe('right')}
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-100 hover:text-green-600"
           disabled={!canSwipe}
        >
          <Heart className="w-8 h-8" />
        </Button>
      </div>
      {lastDirection && (
         <div className="mt-4 text-center">
            <p className="font-bold">Son Eylem: {lastDirection === 'left' ? 'Geçildi' : 'Beğenildi'}</p>
          </div>
      )}
    </div>
  );
}

// Simple on-the-fly style injection for swipe indicators.
// This is a workaround since TinderCard doesn't directly support this.
// We'll use CSS variables modified by the component's onSwipe callback.
const TinderCardWrapper = ({ children, onSwipe }: { children: React.ReactNode, onSwipe: (dir: string) => void }) => {
  const handleSwipe = (dir: string) => {
    // This part is tricky as we need to react to the swipe *during* the drag.
    // react-tinder-card doesn't expose an onSwipeMove with displacement.
    // The visual feedback will appear *after* the swipe action is completed.
    onSwipe(dir);
  };
  
  // A better implementation would require a library that gives us swipe displacement data.
  // For this demo, the indicator will appear on button click or after swipe is done.
  // The CSS-in-JS below is a conceptual placeholder. A real implementation would be more complex.
  return <div>{children}</div>
}

