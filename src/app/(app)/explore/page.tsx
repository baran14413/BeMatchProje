
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Bookmark, Plus, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

const initialPosts = [
  {
    id: 1,
    user: {
      name: 'Selin',
      avatar: 'https://placehold.co/40x40.png',
      aiHint: 'portrait woman city night'
    },
    image: 'https://placehold.co/600x600.png',
    aiHint: 'cityscape night lights',
    caption: 'Şehrin ışıkları ✨',
    likes: 124,
    commentsCount: 12,
    liked: false,
    comments: [
        { id: 1, user: 'Ahmet', text: 'Harika bir fotoğraf!' },
        { id: 2, user: 'Zeynep', text: 'Neresi burası? 😍' },
    ]
  },
  {
    id: 2,
    user: {
      name: 'Ahmet',
      avatar: 'https://placehold.co/40x40.png',
      aiHint: 'portrait man beach sunset'
    },
    image: 'https://placehold.co/600x600.png',
    aiHint: 'beach sunset waves',
    caption: 'Huzur dolu bir akşam.',
    likes: 256,
    commentsCount: 34,
    liked: true, // Example of already liked post
    comments: [
        { id: 1, user: 'Can', text: 'Çok güzel görünüyor!' },
    ]
  },
  {
    id: 3,
    user: {
      name: 'Zeynep',
      avatar: 'https://placehold.co/40x40.png',
      aiHint: 'portrait woman drinking coffee'
    },
    image: 'https://placehold.co/600x600.png',
    aiHint: 'latte art coffee shop',
    caption: 'Kahve ve sanat... ☕️🎨',
    likes: 432,
    commentsCount: 51,
    liked: false,
    comments: []
  },
];

export default function ExplorePage() {
    const [posts, setPosts] = useState(initialPosts);

    const handleLikeClick = (postId: number) => {
        setPosts(posts.map(post => 
            post.id === postId 
            ? { ...post, liked: !post.liked, likes: post.liked ? post.likes -1 : post.likes + 1 } 
            : post
        ));
    };


  return (
    <div className="container mx-auto max-w-lg p-2 pb-20">
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Sheet key={post.id}>
            <Card className="rounded-xl overflow-hidden">
                <CardContent className="p-0">
                {/* Post Header */}
                <div className="flex items-center gap-3 p-3">
                    <Avatar className="w-8 h-8">
                    <AvatarImage src={post.user.avatar} data-ai-hint={post.user.aiHint} />
                    <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{post.user.name}</span>
                </div>

                {/* Post Image */}
                <div className="relative w-full aspect-square">
                    <Image
                    src={post.image}
                    alt={`Post by ${post.user.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint={post.aiHint}
                    />
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between p-3">
                    <div className='flex items-center gap-3'>
                        <Button variant="ghost" size="icon" onClick={() => handleLikeClick(post.id)}>
                            <Heart className="w-6 h-6" fill={post.liked ? 'hsl(var(--destructive))' : 'transparent'} stroke={post.liked ? 'hsl(var(--destructive))' : 'currentColor'}/>
                        </Button>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MessageCircle className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                    </div>
                    <Button variant="ghost" size="icon">
                    <Bookmark className="w-6 h-6" />
                    </Button>
                </div>

                {/* Post Info */}
                <div className="px-3 pb-3 text-sm">
                    <p className="font-semibold">{post.likes.toLocaleString()} beğeni</p>
                    <p>
                    <span className="font-semibold">{post.user.name}</span>{' '}
                    {post.caption}
                    </p>
                    {post.commentsCount > 0 && (
                        <SheetTrigger asChild>
                            <p className="text-muted-foreground mt-1 cursor-pointer">
                            {post.commentsCount.toLocaleString()} yorumun tümünü gör
                            </p>
                        </SheetTrigger>
                    )}
                </div>
                </CardContent>
            </Card>
            <SheetContent side="bottom" className="rounded-t-xl h-[80vh]">
                 <SheetHeader className="text-center">
                    <SheetTitle>Yorumlar</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 h-[calc(100%-8rem)] p-4">
                    <div className="flex flex-col gap-4">
                        {post.comments.length > 0 ? (
                             post.comments.map(comment => (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person portrait" />
                                        <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p><span className="font-semibold">{comment.user}</span> {comment.text}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground">Henüz yorum yok. İlk yorumu sen yap!</p>
                        )}
                    </div>
                </ScrollArea>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
                     <div className="relative">
                        <Input placeholder="Yorum ekle..." className="pr-12" />
                        <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </SheetContent>
          </Sheet>
        ))}
      </div>
      
      {/* Floating Action Button to Add Post */}
       <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg" size="icon">
            <Plus className="h-8 w-8" />
            <span className="sr-only">Yeni Gönderi Ekle</span>
       </Button>
    </div>
  );
}
