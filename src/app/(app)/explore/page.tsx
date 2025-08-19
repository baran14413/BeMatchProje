
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Bookmark, Plus, Send, Loader2, Languages } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translateText } from '@/ai/flows/translate-text-flow';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, getDocs, doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const formatRelativeTime = (date: Date) => {
    try {
        return formatDistanceToNowStrict(date, {
            addSuffix: true,
            locale: tr,
        });
    } catch (e) {
        return 'az önce';
    }
};

type User = {
  uid: string;
  name: string;
  avatarUrl: string;
  aiHint?: string;
};

type Comment = {
  id: string;
  user: User;
  text: string;
  originalText?: string;
  lang?: string;
  isTranslating?: boolean;
  isTranslated?: boolean;
  likes: number;
  liked: boolean;
  createdAt: Date;
};

type Post = DocumentData & {
  id: string;
  type: 'photo' | 'text';
  authorId: string;
  user?: User; // Will be populated after fetching
  image?: string;
  aiHint?: string;
  caption?: string;
  textContent?: string;
  originalTextContent?: string;
  lang?: string;
  isTranslated?: boolean;
  isTranslating?: boolean;
  likes: number;
  commentsCount: number;
  liked: boolean;
  comments: Comment[];
};

const PostSkeleton = () => (
    <Card className="rounded-xl overflow-hidden">
        <CardContent className="p-0">
            <div className="flex items-center gap-3 p-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="w-full aspect-square" />
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </CardContent>
    </Card>
);

export default function ExplorePage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentInput, setCommentInput] = useState('');
    const commentInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPostsAndAuthors = async () => {
            setLoading(true);
            try {
                const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(postsQuery);
                const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

                const populatedPosts = await Promise.all(
                    postsData.map(async (post) => {
                        let authorData: User | undefined = undefined;
                        if (post.authorId) {
                            const userDocRef = doc(db, 'users', post.authorId);
                            const userDocSnap = await getDoc(userDocRef);
                            if (userDocSnap.exists()) {
                                authorData = userDocSnap.data() as User;
                            }
                        }
                        // TODO: Fetch comments for each post
                        return { ...post, user: authorData, comments: [] };
                    })
                );

                setPosts(populatedPosts.filter(p => p.user) as Post[]); // Filter out posts where author couldn't be fetched

            } catch (error) {
                console.error("Error fetching posts: ", error);
                toast({
                    variant: 'destructive',
                    title: 'Gönderiler Yüklenemedi',
                    description: 'Gönderileri alırken bir hata oluştu.',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPostsAndAuthors();
    }, [toast]);

    const handleLikeClick = (postId: string) => {
        setPosts(posts.map(post => 
            post.id === postId 
            ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } 
            : post
        ));
    };

    const handleCommentLikeClick = (postId: string, commentId: string) => {
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
    
    const handleAddEmoji = (emoji: string) => {
      setCommentInput(prevInput => prevInput + emoji);
    };

    const handleReply = (username: string) => {
        setCommentInput(prev => `@${username} ${prev}`);
        commentInputRef.current?.focus();
    };

    const handleTranslatePost = async (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        if (post.isTranslated && post.originalTextContent) {
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
                ...p,
                textContent: p.originalTextContent!,
                isTranslated: false,
                originalTextContent: undefined,
            } : p));
            return;
        }

        if (!post.textContent || !post.lang || post.lang === 'tr') return;

        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, isTranslating: true } : p));

        try {
            const translatedData = await translateText({ textToTranslate: post.textContent });
            if (translatedData.error || !translatedData.translatedText) {
                throw new Error(translatedData.error || 'Çeviri başarısız oldu.');
            }
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
                ...p,
                textContent: translatedData.translatedText!,
                originalTextContent: p.textContent,
                isTranslated: true,
                isTranslating: false,
            } : p));
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Çeviri Hatası',
                description: error.message,
            });
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, isTranslating: false } : p));
        }
    };


    const handleTranslateComment = async (postId: string, commentId: string) => {
        const post = posts.find(p => p.id === postId);
        const comment = post?.comments.find(c => c.id === commentId);
    
        if (!comment) return;
    
        if (comment.isTranslated && comment.originalText) {
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
                ...p,
                comments: p.comments.map(c => c.id === commentId ? {
                    ...c,
                    text: c.originalText!,
                    isTranslated: false,
                    originalText: undefined
                } : c)
            } : p));
            return;
        }

        if (!comment.text || !comment.lang || comment.lang === 'tr') return;

        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
            ...p,
            comments: p.comments.map(c => c.id === commentId ? { ...c, isTranslating: true } : c)
        } : p));
    
        try {
            const translatedData = await translateText({ textToTranslate: comment.text });

            if (translatedData.error || !translatedData.translatedText) {
                throw new Error(translatedData.error || 'Çeviri sırasında bilinmeyen bir hata oluştu.');
            }

            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
                ...p,
                comments: p.comments.map(c => c.id === commentId ? {
                    ...c,
                    text: translatedData.translatedText!,
                    originalText: c.text,
                    isTranslated: true,
                    isTranslating: false
                } : c)
            } : p));
        } catch (error: any) {
            console.error("Translation failed:", error);
            toast({
                variant: 'destructive',
                title: 'Çeviri Başarısız',
                description: error.message || 'Model şu anda yoğun. Lütfen daha sonra tekrar deneyin.',
            });
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
                ...p,
                comments: p.comments.map(c => c.id === commentId ? { ...c, isTranslating: false } : c)
            } : p));
        }
    };


  return (
    <div className="container mx-auto max-w-lg p-2 pb-20">
      <div className="flex flex-col gap-4">
        {loading ? (
            <>
                <PostSkeleton />
                <PostSkeleton />
            </>
        ) : posts.length > 0 ? (
            posts.map((post) => (
            <Sheet key={post.id}>
                <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-3 p-3">
                            <Avatar className="w-8 h-8">
                            <AvatarImage src={post.user?.avatarUrl} data-ai-hint={post.user?.aiHint} />
                            <AvatarFallback>{post.user?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm">{post.user?.name}</span>
                        </div>

                        {post.type === 'photo' && post.image && (
                            <div className="relative w-full aspect-square">
                                <Image
                                src={post.image}
                                alt={`Post by ${post.user?.name}`}
                                fill
                                className="object-cover"
                                data-ai-hint={post.aiHint}
                                />
                            </div>
                        )}
                        
                        {post.type === 'text' && (
                            <div className="px-4 py-2">
                                {post.isTranslating ? (
                                    <p className="text-sm text-muted-foreground italic flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Çevriliyor...</p>
                                ) : (
                                    <p className="text-base whitespace-pre-wrap break-words">{post.textContent}</p>
                                )}

                                {((post.lang && post.lang !== 'tr') || post.isTranslated) && (
                                    <button onClick={() => handleTranslatePost(post.id)} className="text-xs text-muted-foreground hover:underline mt-2 flex items-center gap-1">
                                        <Languages className="w-3 h-3"/>
                                        {post.isTranslated ? 'Aslına bak' : 'Çevirisine bak'}
                                    </button>
                                )}
                            </div>
                        )}

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

                        <div className="px-3 pb-3 text-sm">
                            <p className="font-semibold">{post.likes.toLocaleString()} beğeni</p>
                            {post.type === 'photo' && (
                                <p>
                                    <span className="font-semibold">{post.user?.name}</span>{' '}
                                    {post.caption}
                                </p>
                            )}
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
                    <SheetHeader className="text-center p-4 border-b shrink-0">
                        <SheetTitle>Yorumlar</SheetTitle>
                        <SheetClose className="absolute left-4 top-1/2 -translate-y-1/2" />
                    </SheetHeader>
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col gap-4 p-4">
                            {post.comments.length > 0 ? (
                                post.comments.map(comment => (
                                    <div key={comment.id} className="flex items-start gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={comment.user.avatarUrl} data-ai-hint={comment.user.aiHint} />
                                            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-sm">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-semibold">{comment.user.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{formatRelativeTime(comment.createdAt)}</span>
                                            </div>
                                            
                                            <p className="mt-1">
                                                {comment.isTranslating ? (
                                                    <span className="text-sm text-muted-foreground italic flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Çevriliyor...</span>
                                                ) : (
                                                    <span>{comment.text}</span>
                                                )}
                                            </p>

                                            <div className="flex gap-4 text-xs text-muted-foreground mt-2 items-center">
                                                <span className="cursor-pointer hover:underline" onClick={() => handleReply(comment.user.name)}>Yanıtla</span>
                                                {(comment.lang && comment.lang !== 'tr') || comment.isTranslated ? (
                                                    <span onClick={() => handleTranslateComment(post.id, comment.id)} className="cursor-pointer hover:underline">
                                                        {comment.isTranslated ? 'Aslına bak' : 'Çevirisine bak'}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <Heart 
                                                className="w-4 h-4 cursor-pointer" 
                                                fill={comment.liked ? 'hsl(var(--destructive))' : 'transparent'} 
                                                stroke={comment.liked ? 'hsl(var(--destructive))' : 'currentColor'}
                                                onClick={() => handleCommentLikeClick(post.id, comment.id)}
                                            />
                                            <span className="text-xs text-muted-foreground">{comment.likes > 0 ? comment.likes : ''}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-10">Henüz yorum yok. İlk yorumu sen yap!</p>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-2 bg-background border-t shrink-0">
                        <div className="flex items-center gap-4 px-2 py-1">
                            {['❤️', '👏', '😢', '😘', '😠'].map(emoji => (
                                <span key={emoji} className="text-2xl cursor-pointer" onClick={() => handleAddEmoji(emoji)}>{emoji}</span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="current user portrait" />
                                <AvatarFallback>B</AvatarFallback>
                            </Avatar>
                            <div className="relative flex-1">
                                <Input 
                                    ref={commentInputRef}
                                    placeholder="Yorum ekle..." 
                                    className="bg-muted border-none rounded-full px-4 pr-10" 
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                />
                                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        ))) : (
             <div className="text-center text-muted-foreground py-20 flex flex-col items-center justify-center">
                <p className="text-lg">Henüz hiç gönderi yok.</p>
                <p className="text-sm">İlk gönderiyi paylaşan sen ol!</p>
            </div>
        )}
      </div>
      
       <Link href="/create">
        <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg" size="icon">
                <Plus className="h-8 w-8" />
                <span className="sr-only">Yeni Gönderi Ekle</span>
        </Button>
       </Link>
    </div>
  );
}
