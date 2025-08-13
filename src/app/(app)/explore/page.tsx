
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Plus } from 'lucide-react';

const mockPosts = [
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
    comments: 12,
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
    comments: 34,
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
    comments: 51,
  },
];

export default function ExplorePage() {
  return (
    <div className="container mx-auto max-w-lg p-2 pb-20">
      <div className="flex flex-col gap-4">
        {mockPosts.map((post) => (
          <Card key={post.id} className="rounded-xl overflow-hidden">
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
                    <Button variant="ghost" size="icon">
                        <Heart className="w-6 h-6" />
                    </Button>
                     <Button variant="ghost" size="icon">
                        <MessageCircle className="w-6 h-6" />
                    </Button>
                 </div>
                <Button variant="ghost" size="icon">
                  <Send className="w-6 h-6" />
                </Button>
              </div>

              {/* Post Info */}
              <div className="px-3 pb-3 text-sm">
                <p className="font-semibold">{post.likes.toLocaleString()} beğeni</p>
                <p>
                  <span className="font-semibold">{post.user.name}</span>{' '}
                  {post.caption}
                </p>
                <p className="text-muted-foreground mt-1">
                  {post.comments.toLocaleString()} yorumun tümünü gör
                </p>
              </div>
            </CardContent>
          </Card>
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
