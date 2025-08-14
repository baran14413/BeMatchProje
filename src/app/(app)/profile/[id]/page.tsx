
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  UserPlus,
  Settings,
  List,
  Trash2,
  Pencil,
  Gem,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Post = {
    id: number;
    type: 'photo' | 'text';
    url?: string;
    aiHint?: string;
    textContent?: string;
    caption?: string;
    likes: number;
    comments: number;
};

// In a real app, you would fetch user data based on the `id` param.
// For this example, we'll use a hardcoded user object.
const userProfile = {
  id: 1,
  name: 'Elif',
  username: 'elif.s',
  age: 28,
  avatarUrl: 'https://placehold.co/128x128.png',
  aiHint: 'woman portrait smiling',
  bio: 'Hayatı dolu dolu yaşamayı seven, enerjik biriyim. İstanbul\'da yeni yerler keşfetmek, yoga yapmak ve sinemaya gitmek en büyük tutkularım.',
  interests: ['Sinema', 'Yoga', 'Seyahat', 'Müzik', 'Kitaplar'],
  isPremium: true,
  stats: {
      posts: 18,
      followers: 432,
      following: 210,
  },
  posts: [
    { id: 1, type: 'photo', url: 'https://placehold.co/400x400.png', aiHint: 'woman yoga beach', caption: 'Sahilde yoga keyfi... 🧘‍♀️', likes: 152, comments: 12 },
    { id: 7, type: 'text', textContent: 'Harika bir hafta sonu başlangıcı! Bazen sadece bir fincan kahve ve iyi bir kitap yeterlidir. #huzur #kitapkurdu', likes: 88, comments: 7 },
    { id: 2, type: 'photo', url: 'https://placehold.co/400x400.png', aiHint: 'woman reading cafe', caption: 'Kahve ve kitap ikilisi.', likes: 230, comments: 25 },
    { id: 3, type: 'photo', url: 'https://placehold.co/400x400.png', aiHint: 'cityscape istanbul', caption: 'İstanbul\'un eşsiz manzarası.', likes: 412, comments: 45 },
    { id: 8, type: 'text', textContent: 'Yeni bir film keşfettim ve kesinlikle tavsiye ediyorum! Gerilim ve gizem sevenler kaçırmasın. 🎬', likes: 120, comments: 18 },
    { id: 4, type: 'photo', url: 'https://placehold.co/400x400.png', aiHint: 'movie theater empty', caption: 'Sinema gecesi!', likes: 98, comments: 8 },
    { id: 5, type: 'photo', url: 'https://placehold.co/400x400.png', aiHint: 'coffee art', caption: 'Günün kahvesi.', likes: 188, comments: 19 },
    { id: 6, type: 'photo', url: 'https://placehold.co/400x400.png', aiHint: 'travel map', caption: 'Yeni rotalar peşinde.', likes: 350, comments: 33 },
  ] as Post[],
};

// This is a mock for the current logged-in user's ID
const currentUserId = "1";

const PostCard = ({ post, user, isMyProfile }: { post: Post, user: typeof userProfile, isMyProfile: boolean }) => (
    <Card className="rounded-xl overflow-hidden mb-4 relative group">
        <CardContent className="p-0">
             <div className="flex items-center gap-3 p-3">
                <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl} data-ai-hint={user.aiHint} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{user.name}</span>
                 {isMyProfile && (
                    <div className="flex items-center gap-1 ml-auto">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {post.type === 'photo' && post.url && (
                <div className="relative w-full aspect-square">
                    <Image
                    src={post.url}
                    alt={`Post by ${user.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint={post.aiHint}
                    />
                </div>
            )}
            
            {post.type === 'text' && (
                <div className="px-4 py-6 bg-muted/30">
                     <p className="text-base whitespace-pre-wrap break-words">{post.textContent}</p>
                </div>
            )}

            <div className="flex items-center justify-between p-3">
                <div className='flex items-center gap-3'>
                    <Button variant="ghost" size="icon">
                        <Heart className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MessageSquare className="w-6 h-6" />
                    </Button>
                </div>
                <Button variant="ghost" size="icon">
                    <Bookmark className="w-6 h-6" />
                </Button>
            </div>

            <div className="px-3 pb-3 text-sm">
                <p className="font-semibold">{post.likes.toLocaleString()} beğeni</p>
                {(post.caption || (post.type === 'photo' && post.textContent)) && (
                     <p>
                        <span className="font-semibold">{user.name}</span>{' '}
                        {post.caption || post.textContent}
                    </p>
                )}
                {post.comments > 0 && (
                    <p className="text-muted-foreground mt-1 cursor-pointer">
                    {post.comments.toLocaleString()} yorumun tümünü gör
                    </p>
                )}
            </div>
        </CardContent>
    </Card>
)

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const isMyProfile = params.id === currentUserId;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const StatItem = ({ value, label }: { value: number, label: string }) => (
      <div className="flex flex-col items-center">
          <p className="text-xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
      </div>
  );

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6 pb-20">
      <div className="flex flex-col gap-6">

        {/* Profile Header */}
        <header className="flex gap-4 items-center">
          <Avatar className="w-24 h-24 border-2 border-primary">
            <AvatarImage src={userProfile.avatarUrl} data-ai-hint={userProfile.aiHint} />
            <AvatarFallback className="text-3xl">{userProfile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 grid grid-cols-3 gap-4 text-center">
            <StatItem value={userProfile.posts.length} label="Gönderi" />
            <StatItem value={userProfile.stats.followers} label="Takipçi" />
            <StatItem value={userProfile.stats.following} label="Takip" />
          </div>
        </header>

        {/* Bio Section */}
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                 <h1 className="text-lg font-bold">{userProfile.name}</h1>
                 {userProfile.isPremium && <Gem className="w-5 h-5 text-purple-500" />}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <p className="text-xs font-medium text-green-600">Doğrulanmış Profil</p>
            </div>
             <p className="text-muted-foreground text-sm mt-2">{userProfile.bio}</p>
        </div>


        {/* Action Buttons */}
        <div className="flex gap-2 w-full">
            {isMyProfile ? (
                 <Link href="/profile/edit" className="w-full">
                    <Button variant="outline" className="w-full">
                        <Settings className="mr-2 h-4 w-4" /> Profili Düzenle
                    </Button>
                </Link>
            ) : (
                <>
                    <Button className="flex-1">
                        <UserPlus className="mr-2 h-4 w-4" /> Takip Et
                    </Button>
                    <Link href={`/chat?userId=${params.id}`} className="flex-1">
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
                </>
            )}
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
            <div className="flex justify-between items-center">
                 <TabsList>
                    <TabsTrigger value="posts" className="px-3 flex gap-2">
                        <Grid3x3 className="h-5 w-5" />
                        <span className="hidden sm:inline">Gönderiler</span>
                    </TabsTrigger>
                    {isMyProfile && (
                    <>
                        <TabsTrigger value="likes" className="px-3 flex gap-2">
                            <Heart className="h-5 w-5" />
                            <span className="hidden sm:inline">Beğenilenler</span>
                        </TabsTrigger>
                        <TabsTrigger value="saved" className="px-3 flex gap-2">
                            <Bookmark className="h-5 w-5" />
                            <span className="hidden sm:inline">Kaydedilenler</span>
                        </TabsTrigger>
                    </>
                    )}
                </TabsList>
                 <div className="flex items-center gap-1 ml-4">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                        <Grid3x3 className="w-5 h-5"/>
                    </Button>
                     <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                        <List className="w-5 h-5"/>
                    </Button>
                </div>
            </div>

          <TabsContent value="posts" className="mt-4">
            {viewMode === 'grid' ? (
                 <div className="grid grid-cols-3 gap-1">
                  {userProfile.posts.filter(p => p.type === 'photo').map((post) => (
                    <div key={post.id} className="relative aspect-square rounded-md overflow-hidden group">
                      <Image
                        src={post.url!}
                        alt={post.caption || `Post ${post.id}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={post.aiHint}
                      />
                       {isMyProfile && (
                            <div className="absolute top-1 right-1 flex items-center gap-1">
                                <Button variant="secondary" size="icon" className="h-7 w-7">
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="destructive" size="icon" className="h-7 w-7">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                  ))}
                </div>
            ) : (
                <div className="flex flex-col">
                    {userProfile.posts.map((post) => (
                        <PostCard key={post.id} post={post} user={userProfile} isMyProfile={isMyProfile}/>
                    ))}
                </div>
            )}
             
            {userProfile.posts.length === 0 && (
                <div className='text-center py-10 text-muted-foreground'>
                    <p>Henüz gönderi yok.</p>
                </div>
            )}
          </TabsContent>
          {isMyProfile && (
            <>
              <TabsContent value="likes" className="text-center py-10 text-muted-foreground">
                 <Heart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
                 <h3 className='font-bold text-lg'>Beğenilen Gönderiler</h3>
                 <p className='text-sm'>Henüz bir gönderi beğenmedin. Beğendiğin gönderiler burada görünecek.</p>
              </TabsContent>
              <TabsContent value="saved" className="text-center py-10 text-muted-foreground">
                <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
                <h3 className='font-bold text-lg'>Kaydedilenler</h3>
                <p className='text-sm'>Daha sonra kolayca bulmak için gönderileri kaydet.</p>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
