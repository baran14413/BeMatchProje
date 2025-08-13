'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Bookmark, Plus, Send, Smile, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { translateText } from '@/ai/flows/translate-text-flow';

type Comment = {
  id: number;
  user: { name: string; avatar: string; aiHint: string };
  text: string;
  lang?: string;
  isTranslating?: boolean;
  likes: number;
  liked: boolean;
};

type Post = {
  id: number;
  user: { name: string; avatar: string; aiHint: string };
  image: string;
  aiHint: string;
  caption: string;
  likes: number;
  commentsCount: number;
  liked: boolean;
  comments: Comment[];
};


const initialPosts: Post[] = [
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
    commentsCount: 15, // Updated count
    liked: false,
    comments: [
        { id: 1, user: { name: 'Ahmet', avatar: 'https://placehold.co/40x40.png', aiHint: 'man portrait' }, text: 'Harika bir fotoğraf!', likes: 15, liked: false },
        { id: 2, user: { name: 'Zeynep', avatar: 'https://placehold.co/40x40.png', aiHint: 'woman portrait' }, text: 'Neresi burası? 😍', likes: 3, liked: true },
        { id: 3, user: { name: 'John', avatar: 'https://placehold.co/40x40.png', aiHint: 'man portrait smiling' }, text: 'This looks amazing! Great shot.', lang: 'en', likes: 8, liked: false },
        { id: 4, user: { name: 'Maria', avatar: 'https://placehold.co/40x40.png', aiHint: 'woman portrait laughing' }, text: '¡Qué bonita vista!', lang: 'es', likes: 5, liked: false },
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
    commentsCount: 35, // Updated count
    liked: true, 
    comments: [
        { id: 1, user: { name: 'Can', avatar: 'https://placehold.co/40x40.png', aiHint: 'person portrait' }, text: 'Çok güzel görünüyor!', likes: 22, liked: false },
        { id: 2, user: { name: 'Satoshi', avatar: 'https://placehold.co/40x40.png', aiHint: 'man portrait serious' }, text: '美しい夕日ですね。', lang: 'ja', likes: 12, liked: false },
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
    const [commentInput, setCommentInput] = useState('');

    const handleLikeClick = (postId: number) => {
        setPosts(posts.map(post => 
            post.id === postId 
            ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } 
            : post
        ));
    };

    const handleCommentLikeClick = (postId: number, commentId: number) => {
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments: post.comments.map(comment => {
                        if (comment.id === commentId) {
                            return {
                                ...comment,
                                liked: !comment.liked,
                                likes: comment.liked ? comment.likes - 1 : comment.likes + 1
                            };
                        }
                        return comment;
                    })
                };
            }
            return post;
        }));
    };
    
    const onEmojiClick = (emojiData: EmojiClickData) => {
      setCommentInput(prevInput => prevInput + emojiData.emoji);
    };

    const handleTranslate = async (postId: number, commentId: number) => {
        const post = posts.find(p => p.id === postId);
        const comment = post?.comments.find(c => c.id === commentId);

        if (!comment || !comment.text || !comment.lang || comment.lang === 'tr') return;

        // Set translating state
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
            ...p,
            comments: p.comments.map(c => c.id === commentId ? { ...c, isTranslating: true } : c)
        } : p));

        try {
            const translatedData = await translateText({ textToTranslate: comment.text });
            // Replace original text with translation
             setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
                ...p,
                comments: p.comments.map(c => c.id === commentId ? { ...c, text: translatedData.translatedText, isTranslating: false, lang: 'tr' } : c)
            } : p));
        } catch (error) {
            console.error("Translation failed:", error);
             // Reset translating state on error
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
                ...p,
                comments: p.comments.map(c => c.id === commentId ? { ...c, isTranslating: false } : c)
            } : p));
        }
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
            <SheetContent side="bottom" className="rounded-t-xl h-[80vh] flex flex-col p-0">
                 <SheetHeader className="text-center p-4 border-b">
                    <SheetTitle>Yorumlar</SheetTitle>
                     <SheetClose className="absolute left-4 top-1/2 -translate-y-1/2" />
                </SheetHeader>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-4 p-4">
                        {post.comments.length > 0 ? (
                             post.comments.map(comment => (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={comment.user.avatar} data-ai-hint={comment.user.aiHint} />
                                        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-sm">
                                        <p className="font-semibold">{comment.user.name}</p>
                                        
                                        {comment.isTranslating ? (
                                             <p className="text-sm text-muted-foreground italic flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Çevriliyor...</p>
                                        ) : (
                                            <p>{comment.text}</p>
                                        )}

                                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                            <span className="cursor-pointer hover:underline">Yanıtla</span>
                                            {comment.lang && comment.lang !== 'tr' && (
                                                <span onClick={() => handleTranslate(post.id, comment.id)} className="cursor-pointer hover:underline">Çevirisine bak</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5">
                                        <Heart 
                                            className="w-4 h-4 cursor-pointer" 
                                            fill={comment.liked ? 'hsl(var(--destructive))' : 'transparent'} 
                                            stroke={comment.liked ? 'hsl(var(--destructive))' : 'currentColor'}
                                            onClick={() => handleCommentLikeClick(post.id, comment.id)}
                                        />
                                        <span className="text-xs text-muted-foreground">{comment.likes}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Henüz yorum yok. İlk yorumu sen yap!</p>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-2 bg-background border-t">
                     <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="current user portrait" />
                            <AvatarFallback>B</AvatarFallback>
                        </Avatar>
                        <Input 
                            placeholder="Yorum ekle..." 
                            className="flex-1 bg-muted border-none rounded-full px-4" 
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                        />
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button size="icon" variant="ghost">
                                    <Smile className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none">
                               <EmojiPicker onEmojiClick={onEmojiClick} />
                            </PopoverContent>
                        </Popover>
                        <Button size="icon" variant="ghost">
                            <Send className="h-5 w-5" />
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
