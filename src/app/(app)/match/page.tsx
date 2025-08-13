'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Heart, Undo2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const mockUsers = [
  {
    id: 1,
    name: 'Elif, 28',
    username: 'elif28',
    bio: 'Kahve ve seyahat tutkunu.',
    interests: ['Seyahat', 'Okuma', 'Kahve'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait woman',
  },
  {
    id: 2,
    name: 'Mehmet, 32',
    username: 'mehmet_engineer',
    bio: 'Hafta sonları dağlarda yürüyüş.',
    interests: ['Yürüyüş', 'Teknoloji', 'Film'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'portrait man',
  },
  {
    id: 3,
    name: 'Ayşe, 25',
    username: 'artbyayse',
    bio: 'Sanat galerilerini gezmek.',
    interests: ['Sanat', 'Yemek', 'Müzik'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'person painting',
  },
  {
    id: 4,
    name: 'Burak, 30',
    username: 'adventurerburak',
    bio: 'Maceraperest bir ruh.',
    interests: ['Macera', 'Spor', 'Dalış'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'man skydiving',
  },
    {
    id: 5,
    name: 'Zeynep, 29',
    username: 'zeynep_yogi',
    bio: 'Yoga ve meditasyonla ilgileniyorum.',
    interests: ['Yoga', 'Meditasyon', 'Sağlıklı Yaşam'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'woman doing yoga',
  },
  {
    id: 6,
    name: 'Ahmet, 35',
    username: 'ahmet_cooks',
    bio: 'Yeni lezzetler denemeyi seviyorum.',
    interests: ['Yemek', 'Gurme', 'Keşif'],
    image: 'https://placehold.co/600x800.png',
    aiHint: 'man cooking',
  },
];

export default function MatchPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Sana Özel Öneriler</h1>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full max-w-4xl"
      >
        <CarouselContent>
          {mockUsers.map((user) => (
            <CarouselItem key={user.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card className="overflow-hidden rounded-2xl shadow-lg transition-transform hover:scale-105 duration-300">
                  <CardContent className="p-0">
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={user.image}
                        alt={user.name}
                        fill
                        className="object-cover"
                        data-ai-hint={user.aiHint}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button variant="outline" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm border-amber-500 text-amber-500 hover:bg-amber-100 hover:text-amber-600">
                            <X className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm border-green-500 text-green-500 hover:bg-green-100 hover:text-green-600">
                            <Heart className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/90 to-transparent p-4 flex flex-col justify-end">
                        <h2 className="text-2xl font-bold text-white font-headline">{user.name}</h2>
                        <p className="text-sm text-white/80 font-mono">@{user.username}</p>
                        <p className="text-white/90 mt-2 text-sm">{user.bio}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {user.interests.map((interest) => (
                                <Badge key={interest} variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-sm text-xs">
                                    {interest}
                                </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-12"/>
        <CarouselNext className="mr-12"/>
      </Carousel>
    </div>
  );
}
