
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ShieldCheck,
  MessageSquare,
  MoreVertical,
  Flag,
  Ban,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// In a real app, you would fetch user data based on the `id` param.
// For this example, we'll use a hardcoded user object.
const userProfile = {
  name: 'Elif',
  age: 28,
  avatarUrl: 'https://placehold.co/128x128.png',
  aiHint: 'woman portrait smiling',
  bio: 'Hayatı keşfetmeyi seven, enerjik biriyim. İstanbul\'da yaşıyorum ve yeni yerler keşfetmek, yoga yapmak ve sinemaya gitmek en büyük tutkularım. Benim gibi hayat dolu, pozitif birini arıyorum.',
  interests: ['Sinema', 'Yoga', 'Seyahat', 'Müzik', 'Kitaplar'],
  gallery: [
    { id: 1, url: 'https://placehold.co/400x600.png', aiHint: 'woman yoga beach' },
    { id: 2, url: 'https://placehold.co/400x600.png', aiHint: 'woman reading cafe' },
    { id: 3, url: 'https://placehold.co/400x600.png', aiHint: 'cityscape istanbul' },
    { id: 4, url: 'https://placehold.co/400x600.png', aiHint: 'movie theater empty' },
  ],
};

export default function UserProfilePage({ params }: { params: { id: string } }) {
  // You can use params.id to fetch the specific user's data
  // For now, we'll just display the placeholder data.

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-8">
      <div className="flex flex-col gap-8">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-36 h-36 border-4 border-background ring-4 ring-primary">
                <AvatarImage
                  src={userProfile.avatarUrl}
                  data-ai-hint={userProfile.aiHint}
                />
                <AvatarFallback className="text-5xl">
                  {userProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold font-headline">
                {userProfile.name}, {userProfile.age}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <p className="text-sm font-medium text-green-600">
                  Doğrulanmış Profil
                </p>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full">
                <Link href="/chat" className="flex-1">
                  <Button className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" /> Mesaj Gönder
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Daha Fazla</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Flag className="mr-2 h-4 w-4" />
                      <span>Şikayet Et</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Ban className="mr-2 h-4 w-4" />
                      <span>Engelle</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Card */}
        <Card>
          <CardHeader>
            <CardTitle>Hakkımda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-base">{userProfile.bio}</p>
          </CardContent>
        </Card>

        {/* Interests Card */}
        <Card>
          <CardHeader>
            <CardTitle>İlgi Alanları</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {userProfile.interests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="text-sm px-3 py-1 rounded-lg"
              >
                {interest}
              </Badge>
            ))}
          </CardContent>
        </Card>

        {/* Gallery Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fotoğraflarım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userProfile.gallery.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden group"
                >
                  <Image
                    src={image.url}
                    alt={`Fotoğraf ${image.id}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    data-ai-hint={image.aiHint}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
