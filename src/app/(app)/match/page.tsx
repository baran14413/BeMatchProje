
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const db = [
  {
    id: 1,
    name: 'Elif',
    age: 28,
    city: 'İstanbul',
    hobbies: ['Sinema', 'Yoga', 'Seyahat'],
    bio: 'Hayatı keşfetmeyi seven, enerjik biriyim.',
    image: 'https://placehold.co/128x128.png',
    aiHint: 'portrait woman smiling',
  },
  {
    id: 2,
    name: 'Mehmet',
    age: 32,
    city: 'Ankara',
    hobbies: ['Doğa Yürüyüşü', 'Kitap', 'Müzik'],
    bio: 'Hafta sonları kendimi doğaya atarım.',
    image: 'https://placehold.co/128x128.png',
    aiHint: 'portrait man hiking',
  },
  {
    id: 3,
    name: 'Ayşe',
    age: 25,
    city: 'İzmir',
    hobbies: ['Fotoğrafçılık', 'Dans', 'Hayvanlar'],
    bio: 'Gördüğüm her güzel anı ölümsüzleştirmeye çalışırım.',
    image: 'https://placehold.co/128x128.png',
    aiHint: 'portrait woman beach',
  },
  {
    id: 4,
    name: 'Can',
    age: 29,
    city: 'İstanbul',
    hobbies: ['Teknoloji', 'Basketbol', 'Yemek'],
    bio: 'Yazılım mühendisiyim ve teknolojiyle iç içeyim.',
    image: 'https://placehold.co/128x128.png',
    aiHint: 'portrait man professional',
  },
  {
    id: 5,
    name: 'Zeynep',
    age: 30,
    city: 'Bursa',
    hobbies: ['Kahve', 'Sanat', 'Tarih'],
    bio: 'Üçüncü nesil kahve dükkanlarını keşfetmeyi severim.',
    image: 'https://placehold.co/128x128.png',
    aiHint: 'portrait woman drinking coffee',
  },
   {
    id: 6,
    name: 'Ahmet',
    age: 35,
    city: 'Antalya',
    hobbies: ['Yüzme', 'Gitar', 'Kamp'],
    bio: 'Macerayı ve yeni yerler keşfetmeyi severim.',
    image: 'https://placehold.co/128x128.png',
    aiHint: 'portrait man beach sunset',
  },
  {
    id: 7,
    name: 'Selin',
    age: 27,
    city: 'İzmir',
    hobbies: ['Gurme', 'Tiyatro', 'Bisiklet'],
    bio: 'Lezzetli yemekler ve sanatla dolu bir hayat.',
    image: 'https://placehold.co/128x128.png',
    aiHint: 'portrait woman city night',
  },
];

export default function MatchPage() {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold px-4 pt-4 pb-2 font-headline">Sana Uygun Kişiler</h1>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {db.map((user) => (
            <Link href={`/profile/${user.id}`} key={user.id} className="block hover:bg-muted/50 transition-colors">
              <div className="p-4 flex items-center gap-4 border-b">
                <Avatar className="w-16 h-16 border">
                  <AvatarImage src={user.image} alt={user.name} data-ai-hint={user.aiHint} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-bold">{user.name},</h3>
                    <p className="text-lg text-muted-foreground">{user.age}</p>
                  </div>
                   <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <p className="text-sm">{user.city}</p>
                   </div>
                </div>
              </div>
            </Link>
          ))}
          {!db.length && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10">
              <h3 className="text-xl font-bold">Görünüşe Göre Etrafta Kimse Kalmadı</h3>
              <p className="mt-2">Daha fazla kişi görmek için daha sonra tekrar kontrol et.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
