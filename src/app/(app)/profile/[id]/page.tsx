
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck,
  MessageSquare,
  MoreVertical,
  Flag,
  Ban,
  Grid3x3,
  Heart,
  Bookmark,
  UserPlus
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// In a real app, you would fetch user data based on the `id` param.
// For this example, we'll use a hardcoded user object.
const userProfile = {
  id: 1,
  name: 'Elif',
  username: 'elif.s',
  age: 28,
  avatarUrl: 'https://placehold.co/128x128.png',
  aiHint: 'woman portrait smiling',
  bio: 'Hayatı keşfetmeyi seven, enerjik biriyim. İstanbul\'da yaşıyorum ve yeni yerler keşfetmek, yoga yapmak ve sinemaya gitmek en büyük tutkularım. Benim gibi hayat dolu, pozitif birini arıyorum.',
  interests: ['Sinema', 'Yoga', 'Seyahat', 'Müzik', 'Kitaplar'],
  stats: {
      posts: 18,
      followers: 432,
      following: 210,
  },
  gallery: [
    { id: 1, url: 'https://placehold.co/400x400.png', aiHint: 'woman yoga beach' },
    { id: 2, url: 'https://placehold.co/400x400.png', aiHint: 'woman reading cafe' },
    { id: 3, url: 'https://placehold.co/400x400.png', aiHint: 'cityscape istanbul' },
    { id: 4, url: 'https://placehold.co/400x400.png', aiHint: 'movie theater empty' },
    { id: 5, url: 'https://placehold.co/400x400.png', aiHint: 'coffee art' },
    { id: 6, url: 'https://placehold.co/400x400.png', aiHint: 'travel map' },
  ],
};

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;

  const StatItem = ({ value, label }: { value: number, label: string }) => (
      <div className="flex flex-col items-center">
          <p className="text-xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
      </div>
  );

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6">
      <div className="flex flex-col gap-6">

        {/* Profile Header */}
        <header className="flex gap-4 items-center">
          <Avatar className="w-24 h-24 border-2 border-primary">
            <AvatarImage src={userProfile.avatarUrl} data-ai-hint={userProfile.aiHint} />
            <AvatarFallback className="text-3xl">{userProfile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 grid grid-cols-3 gap-4 text-center">
            <StatItem value={userProfile.stats.posts} label="Gönderi" />
            <StatItem value={userProfile.stats.followers} label="Takipçi" />
            <StatItem value={userProfile.stats.following} label="Takip" />
          </div>
        </header>

        {/* Bio Section */}
        <div className="flex flex-col">
            <h1 className="text-lg font-bold">{userProfile.name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <p className="text-xs font-medium text-green-600">Doğrulanmış Profil</p>
            </div>
             <p className="text-muted-foreground text-sm mt-2">{userProfile.bio}</p>
        </div>


        {/* Action Buttons */}
        <div className="flex gap-2 w-full">
            <Button className="flex-1">
                <UserPlus className="mr-2 h-4 w-4" /> Takip Et
            </Button>
            <Link href={`/chat?userId=${id}`} className="flex-1">
                <Button variant="secondary" className="w-full">
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

        {/* Interests */}
        <div className="flex flex-wrap gap-2">
            {userProfile.interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs rounded-md">
                {interest}
              </Badge>
            ))}
        </div>
        
        <Separator />

        {/* Gallery Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts"><Grid3x3 className="mr-2 h-4 w-4" />Gönderiler</TabsTrigger>
            <TabsTrigger value="likes"><Heart className="mr-2 h-4 w-4" />Beğeniler</TabsTrigger>
            <TabsTrigger value="saved"><Bookmark className="mr-2 h-4 w-4" />Kaydedilenler</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-4">
            <div className="grid grid-cols-3 gap-1">
              {userProfile.gallery.map((image) => (
                <div key={image.id} className="relative aspect-square rounded-md overflow-hidden group">
                  <Image
                    src={image.url}
                    alt={`Fotoğraf ${image.id}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={image.aiHint}
                  />
                </div>
              ))}
            </div>
             {userProfile.gallery.length === 0 && (
                <div className='text-center py-10 text-muted-foreground'>
                    <p>Henüz gönderi yok.</p>
                </div>
            )}
          </TabsContent>
          <TabsContent value="likes" className="text-center py-10 text-muted-foreground">
             <Heart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
             <h3 className='font-bold text-lg'>Beğenilenler Gizli</h3>
             <p className='text-sm'>Sadece {userProfile.name} kendi beğendiği gönderileri görebilir.</p>
          </TabsContent>
          <TabsContent value="saved" className="text-center py-10 text-muted-foreground">
            <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
            <h3 className='font-bold text-lg'>Kaydedilenler Gizli</h3>
            <p className='text-sm'>Sadece {userProfile.name} kendi kaydettiği gönderileri görebilir.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
