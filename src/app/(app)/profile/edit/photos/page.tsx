
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Grid3x3, List, Heart, MessageSquare, Bookmark } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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

// In a real app, this data would be fetched for the logged-in user.
const userProfile = {
  id: 1,
  name: 'Elif',
  avatarUrl: 'https://placehold.co/128x128.png',
  aiHint: 'woman portrait smiling',
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


const PostCard = ({ post, user }: { post: Post, user: typeof userProfile }) => (
    <Card className="rounded-xl overflow-hidden mb-4 relative group">
        <CardContent className="p-0">
            <div className="flex items-center gap-3 p-3">
                <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl} data-ai-hint={user.aiHint} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{user.name}</span>
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
            <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                <Trash2 className="w-4 h-4" />
            </Button>
        </CardContent>
    </Card>
);

export default function ManagePhotosPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gönderileri Yönet</CardTitle>
                    <CardDescription>
                        Tüm gönderilerinizi görüntüleyin ve yönetin.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                        <Grid3x3 className="w-5 h-5"/>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                        <List className="w-5 h-5"/>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {viewMode === 'grid' ? (
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {userProfile.posts.filter(p => p.type === 'photo').map(post => (
                            <div key={post.id} className="relative group aspect-square">
                                <Image 
                                    src={post.url!} 
                                    alt={post.caption || `Post ${post.id}`}
                                    fill 
                                    className="object-cover rounded-md"
                                    data-ai-hint={post.aiHint}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                   <Button variant="destructive" size="icon" className="h-9 w-9">
                                       <Trash2 className="h-4 w-4" />
                                   </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {userProfile.posts.map((post) => (
                           <PostCard key={post.id} post={post} user={userProfile}/>
                        ))}
                    </div>
                )}
                 {userProfile.posts.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>Henüz gönderi yok.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
