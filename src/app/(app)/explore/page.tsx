
'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Bookmark, Plus, Send, Loader2, Languages, Lock, MoreHorizontal, EyeOff, UserX, Flag, Sparkles, Image as ImageIcon, Type } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translateText } from '@/ai/flows/translate-text-flow';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, getDocs, doc, getDoc, DocumentData, writeBatch, arrayUnion, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

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
  isGalleryPrivate?: boolean;
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
  url?: string; // For photo posts, renamed from 'image'
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
  isGalleryLocked?: boolean; // New flag
  isAiEdited?: boolean;
};

const PostSkeleton = () => (
    <Card className="rounded-none md:rounded-xl overflow-hidden shadow-none md:shadow-sm border-0 md:border-b w-full">
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
    const router = useRouter();
    const currentUser = auth.currentUser;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

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
                        let isGalleryLocked = false;

                        if (post.authorId) {
                            const userDocRef = doc(db, 'users', post.authorId);
                            const userDocSnap = await getDoc(userDocRef);
                            if (userDocSnap.exists()) {
                                authorData = userDocSnap.data() as User;
                                
                                if (post.type === 'photo' && authorData.isGalleryPrivate && post.authorId !== currentUser?.uid) {
                                     if (currentUser) {
                                        const permissionDocRef = doc(db, 'users', post.authorId, 'galleryPermissions', currentUser.uid);
                                        const permissionDocSnap = await getDoc(permissionDocRef);
                                        if (!permissionDocSnap.exists()) {
                                            isGalleryLocked = true;
                                        }
                                        // TODO: check for expired temp access
                                    } else {
                                        isGalleryLocked = true; // Not logged in, lock it
                                    }
                                }
                            }
                        }
                        return { ...post, user: authorData, comments: [], isGalleryLocked };
                    })
                );

                setPosts(populatedPosts.filter(p => p.user) as Post[]);

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

        if (currentUser) {
            fetchPostsAndAuthors();
        } else {
            router.push('/login');
            setLoading(false);
        }
    }, [toast, currentUser, router]);

    const handleLikeClick = async (postId: string) => {
        if (!currentUser) return;
        
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
    
        const post = posts[postIndex];
        const newLikedState = !post.liked;
        const newLikesCount = newLikedState ? post.likes + 1 : post.likes - 1;
    
        // Optimistically update UI
        setPosts(prevPosts => {
            const newPosts = [...prevPosts];
            newPosts[postIndex] = { ...post, liked: newLikedState, likes: newLikesCount };
            return newPosts;
        });

        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                likes: increment(newLikedState ? 1 : -1)
            });
            // Also update user's liked posts subcollection if needed
        } catch (error) {
            console.error("Error updating like:", error);
             // Revert optimistic update on error
            setPosts(prevPosts => {
                const newPosts = [...prevPosts];
                newPosts[postIndex] = post;
                return newPosts;
            });
            toast({ variant: 'destructive', title: 'Beğenme işlemi başarısız oldu.' });
        }
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
    
    const hidePost = (postId: string) => {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
        toast({ title: 'Gönderi gizlendi.' });
    };

    const hideAllFromUser = (authorId: string) => {
        setPosts(prevPosts => prevPosts.filter(p => p.authorId !== authorId));
        toast({ title: 'Bu kullanıcıdan gelen tüm gönderiler gizlendi.' });
    };

    const blockUser = async (authorId: string) => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Giriş yapmalısınız.' });
            return;
        }
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                blockedUsers: arrayUnion(authorId)
            });
            hideAllFromUser(authorId); // Block and hide
            toast({ variant: 'destructive', title: 'Kullanıcı engellendi.' });
        } catch (error) {
            console.error('Error blocking user:', error);
            toast({ variant: 'destructive', title: 'Kullanıcı engellenirken hata oluştu.' });
        }
    };
    
    const onSelectPhoto = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                if (reader.result) {
                    sessionStorage.setItem('photo_for_upload', reader.result.toString());
                    router.push('/create?type=photo');
                }
            });
            reader.readAsDataURL(e.target.files[0]);
        }
        setIsCreateSheetOpen(false);
    };

    const handleCreateTextPost = () => {
        setIsCreateSheetOpen(false);
        router.push('/create?type=text');
    };

  return (
    <div className="container mx-auto max-w-lg p-0 md:pb-20">
      <div className="flex flex-col">
        {loading ? (
            <>
                <PostSkeleton />
                <PostSkeleton />
            </>
        ) : posts.length > 0 ? (
            posts.map((post) => (
            <Sheet key={post.id}>
                <Card className="w-full rounded-none md:rounded-xl overflow-hidden shadow-none border-0 md:border-b">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-3 p-3">
                            <Avatar className="w-8 h-8">
                            <AvatarImage src={post.user?.avatarUrl} data-ai-hint={post.user?.aiHint} />
                            <AvatarFallback>{post.user?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{post.user?.name}</span>
                                {post.isAiEdited && (
                                    <Badge variant="outline" className="text-xs w-fit text-purple-500 border-purple-300">
                                        <Sparkles className="w-3 h-3 mr-1"/>
                                        BeAI ile düzenlendi
                                    </Badge>
                                )}
                            </div>
                            <div className="ml-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="w-5 h-5"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => hidePost(post.id)}>
                                            <EyeOff className="mr-2 h-4 w-4"/>
                                            <span>Gönderiyi Gizle</span>
                                        </DropdownMenuItem>
                                         <DropdownMenuItem onClick={() => hideAllFromUser(post.authorId)}>
                                            <EyeOff className="mr-2 h-4 w-4"/>
                                            <span>Bu Kullanıcıdan Gizle</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => blockUser(post.authorId)}>
                                            <UserX className="mr-2 h-4 w-4"/>
                                            <span>Kullanıcıyı Engelle</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                            <Flag className="mr-2 h-4 w-4"/>
                                            <span>Gönderiyi Şikayet Et</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {post.type === 'photo' && post.url && (
                            <div className="relative w-full aspect-square group" onDoubleClick={() => handleLikeClick(post.id)}>
                                <Image
                                src={post.url}
                                alt={`Post by ${post.user?.name}`}
                                fill
                                className={cn("object-cover", post.isGalleryLocked && "blur-md")}
                                data-ai-hint={post.aiHint}
                                priority
                                />
                                {post.isGalleryLocked && (
                                     <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center text-white p-4">
                                        <Lock className="w-10 h-10 mb-4"/>
                                        <h3 className="font-bold">Bu Galeri Gizli</h3>
                                        <Link href={`/profile/${post.authorId}`} className='mt-4'>
                                            <Button variant="secondary">
                                                Galeriyi görmek için izin iste
                                            </Button>
                                        </Link>
                                    </div>
                                )}
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
                            {post.type === 'photo' && post.caption && !post.isGalleryLocked && (
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
                                <AvatarImage src={currentUser?.photoURL || "https://placehold.co/40x40.png"} data-ai-hint="current user portrait" />
                                <AvatarFallback>{currentUser?.displayName?.charAt(0) || 'B'}</AvatarFallback>
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
      
       <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetTrigger asChild>
            <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg" size="icon">
                    <Plus className="h-8 w-8" />
                    <span className="sr-only">Yeni Gönderi Ekle</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-xl h-auto flex flex-col p-4 gap-4">
             <SheetHeader className="text-center">
                <SheetTitle>Yeni Gönderi Oluştur</SheetTitle>
             </SheetHeader>
             <input type="file" ref={fileInputRef} onChange={onSelectPhoto} accept="image/*" className="hidden" />
             <Button variant="outline" className="w-full justify-start p-6" onClick={() => fileInputRef.current?.click()}>
                 <ImageIcon className="w-6 h-6 mr-4" />
                 <span className='text-lg'>Fotoğraf Paylaş</span>
             </Button>
             <Button variant="outline" className="w-full justify-start p-6" onClick={handleCreateTextPost}>
                 <Type className="w-6 h-6 mr-4" />
                 <span className='text-lg'>Yazı Yaz</span>
             </Button>
        </SheetContent>
       </Sheet>
    </div>
  );
}
