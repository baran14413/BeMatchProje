'use client';

import { useState } from 'react';
import Image from 'next/image';
import HTMLFlipBook from 'react-pageflip';

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
  {
    id: 3,
    name: 'Ayşe, 25',
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman reading',
    },
];

export default function MatchPage() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleFlip = (e: any) => {
        const newIndex = e.data;
        setCurrentIndex(newIndex);
        console.log('Flipped to page: ' + newIndex);
        // You can add logic for like/dislike based on flip direction if needed
    };

    return (
        <div className="flex items-center justify-center w-full h-full">
             <div className="w-full max-w-sm aspect-[3/4.5]">
                <HTMLFlipBook
                    width={300}
                    height={450}
                    size="stretch"
                    minWidth={300}
                    maxWidth={400}
                    minHeight={450}
                    maxHeight={600}
                    maxShadowOpacity={0.5}
                    showCover={false}
                    mobileScrollSupport={true}
                    onFlip={handleFlip}
                    className="flex items-center justify-center"
                >
                    {mockUsers.map((user, index) => (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border bg-card" key={user.id}>
                            <Image
                                src={user.image}
                                alt={user.name}
                                fill
                                className="object-cover"
                                data-ai-hint={user.aiHint}
                                priority={index === 0}
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                <h2 className="text-3xl font-bold text-white font-headline">{user.name}</h2>
                            </div>
                        </div>
                    ))}
                </HTMLFlipBook>
            </div>
        </div>
    );
}
