
'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Bookmark, Plus, MoreHorizontal, EyeOff, UserX, Flag, Sparkles, Crown, Trash2, Pencil, Users, Loader2, Home, Shuffle, User, Menu, Share2, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translateText, TranslateTextOutput } from '@/ai/flows/translate-text-flow';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { collection, query, getDocs, doc, getDoc, DocumentData, writeBatch, arrayUnion, updateDoc, increment, addDoc, serverTimestamp, where, documentId, arrayRemove, runTransaction, setDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadString, deleteObject } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { MentionTextarea } from '@/components/ui/mention-textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AnimatePresence, motion } from 'framer-motion';

// --- TYPE DEFINITIONS ---
type User = {
  uid: string;
  name: string;
  username: string;
  avatarUrl: string;
  aiHint?: string;
  isGalleryPrivate?: boolean;
  isPremium?: boolean;
  level?: number;
};

type Comment = {
  id: string;
  authorId: string;
  user?: User;
  text: string;
  imageUrl?: string;
  originalText?: string;
  lang?: string;
  translatedText?: string;
  isTranslating: boolean;
  isTranslated: boolean;
  likes: number;
  liked: boolean;
  createdAt: any; 
  parentId?: string | null;
  replies?: Comment[];
  isEdited?: boolean;
  depth?: number; 
  replyCount?: number;
};

type Post = DocumentData & {
  id: string;
  type: 'photo' | 'text';
  authorId: string;
  user?: User; 
  url?: string; 
  aiHint?: string;
  caption?: string;
  textContent?: string;
  originalTextContent?: string;
  lang?: string;
  translatedText?: string;
  isTranslated: boolean;
  isTranslating: boolean;
  likes: number;
  recentLikers: User[];
  commentsCount: number;
  liked: boolean;
  comments: Comment[];
  isGalleryLocked?: boolean; 
  isAiEdited?: boolean;
};

// --- HELPER FUNCTIONS & COMPONENTS ---
const formatRelativeTime = (date: Date) => {
    try { return formatDistanceToNowStrict(date, { addSuffix: true, locale: tr }); } 
    catch (e) { return 'az önce'; }
};

const HashtagAndMentionRenderer = ({ text, className }: { text: string, className?: string }) => {
    if (!text) return null;
    const parts = text.split(/([#@]\w+)/g);
    return (
        <React.Fragment>
            {parts.map((part, i) => {
                if (part.startsWith('#')) {
                    return <Link key={i} href={`/tag/${part.substring(1)}`} className={cn("font-bold hover:underline", className)} onClick={(e) => e.stopPropagation()}>{part}</Link>;
                }
                if (part.startsWith('@')) {
                     return <Link key={i} href={`/profile/${part.substring(1)}`} className={cn("font-bold hover:underline", className)} onClick={(e) => e.stopPropagation()}>{part}</Link>;
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </React.Fragment>
    );
};

const PostSkeleton = () => (
    <div className="space-y-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[250px]" /><Skeleton className="h-4 w-[200px]" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[250px]" /><Skeleton className="h-4 w-[200px]" /></div></div></CardContent></Card>
    </div>
);


// --- MAIN PAGE COMPONENT ---
export default function ExplorePage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const currentUser = auth.currentUser;
    const [isCommentSheetOpen, setCommentSheetOpen] = useState(false);
    const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    

    const handleOpenComments = (post: Post) => {
        if (!isCommentSheetOpen) {
            setActivePostForComments(post);
            setCommentSheetOpen(true);
            // Fetching logic would go here
        }
    };
    const handleDeletePost = (post: Post) => { /* ... */ };
    
    const handleLikeClick = async (postId: string) => {
      if (!currentUser) {
        toast({ title: 'Beğenmek için giriş yapmalısınız.', variant: 'destructive' });
        return;
      }
      
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex === -1) return;
      
      const post = posts[postIndex];
      const newLikedState = !post.liked;
      const newLikesCount = post.liked ? post.likes - 1 : post.likes + 1;
      
      // Optimistic UI update
      const updatedPosts = [...posts];
      updatedPosts[postIndex] = { ...post, liked: newLikedState, likes: newLikesCount };
      setPosts(updatedPosts);
      
      const postRef = doc(db, 'posts', postId);
      const likeRef = doc(postRef, 'likes', currentUser.uid);

      try {
        await runTransaction(db, async (transaction) => {
          if (newLikedState) {
            transaction.set(likeRef, { likedAt: serverTimestamp() });
            transaction.update(postRef, { likes: increment(1) });
          } else {
            transaction.delete(likeRef);
            transaction.update(postRef, { likes: increment(-1) });
          }
        });
      } catch (error) {
        console.error("Error toggling like:", error);
        // Revert UI on error
        setPosts(posts);
        toast({ title: 'Beğenme işlemi başarısız oldu.', variant: 'destructive' });
      }
    };

    const handleShare = async (post: Post) => {
        const shareData = {
            title: `BeMatch'te bir gönderi`,
            text: post.caption || post.textContent || `Bu harika gönderiye göz at!`,
            url: window.location.href, // Or a specific post URL if you have one
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                 // Fallback for browsers that don't support Web Share API
                await navigator.clipboard.writeText(shareData.url);
                toast({ title: 'Bağlantı kopyalandı!', description: 'Gönderi bağlantısı panoya kopyalandı.' });
            }
        } catch (error) {
            console.error('Error sharing:', error);
            toast({ title: 'Paylaşım başarısız oldu.', variant: 'destructive' });
        }
    };


    // Fetch posts data
    useEffect(() => {
        const fetchPostsAndAuthors = async () => {
            setLoading(true);
            try {
                const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(postsQuery);
                const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isTranslated: false, isTranslating: false } as Post));

                if (postsData.length === 0) {
                    setPosts([]);
                    setLoading(false);
                    return;
                }

                const authorIds = [...new Set(postsData.map(p => p.authorId).filter(id => !!id))];
                const authorsData: Record<string, User> = {};
                
                if(authorIds.length > 0) {
                     const authorsQuery = query(collection(db, 'users'), where(documentId(), 'in', authorIds));
                    const authorsSnapshot = await getDocs(authorsQuery);
                    authorsSnapshot.forEach(doc => {
                        authorsData[doc.id] = { ...doc.data(), uid: doc.id } as User;
                    });
                }
                
                const populatedPosts = await Promise.all(
                    postsData.map(async (post) => {
                        let liked = false;
                        if (currentUser) {
                           const likeDocRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
                           const likeDocSnap = await getDoc(likeDocRef);
                           liked = likeDocSnap.exists();
                        }
                        return { ...post, user: authorsData[post.authorId], comments: [], liked };
                    })
                );

                setPosts(populatedPosts.filter(p => p.user) as Post[]);

            } catch (error) {
                console.error("Error fetching posts: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPostsAndAuthors();
    }, [currentUser]);


    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
             <div className="w-full pb-20 md:pb-0">
                <div className="mx-auto max-w-lg space-y-4">
                    {loading ? (
                        <PostSkeleton />
                    ) : posts.length > 0 ? (
                        posts.map((post) => (
                            <Card key={post.id} className="w-full overflow-hidden rounded-none md:rounded-xl">
                                <CardContent className="p-0">
                                    <div className="flex items-center justify-between p-3">
                                        <Link href={`/profile/${post.user?.username}`} className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border-2 border-primary/20">
                                                <AvatarImage src={post.user?.avatarUrl} />
                                                <AvatarFallback>{post.user?.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-sm flex items-center gap-1.5">{post.user?.name} {post.user?.isPremium && <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400"/>}</p>
                                                <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt?.toDate())}</p>
                                            </div>
                                        </Link>
                                    </div>
                                    {post.type === 'photo' && post.url && (
                                        <div className="relative w-full aspect-square bg-muted">
                                            <Image src={post.url} alt={post.caption || `Post by ${post.user?.name}`} fill className="object-cover" priority />
                                        </div>
                                    )}
                                    {post.type === 'text' && post.textContent && (
                                        <div className="px-4 py-6 bg-muted/20">
                                            <p className="text-base whitespace-pre-wrap break-words">
                                                <HashtagAndMentionRenderer text={post.textContent} />
                                            </p>
                                        </div>
                                    )}
                                    <div className="p-4 space-y-2">
                                        {post.caption && post.type === 'photo' && (
                                            <p className="text-sm"><HashtagAndMentionRenderer text={post.caption} /></p>
                                        )}
                                        <div className='flex items-center gap-2 pt-2'>
                                            <Button size="sm" className={cn("h-8 gap-1.5 rounded-full", post.liked && "text-red-500")} variant="secondary" onClick={() => handleLikeClick(post.id)}>
                                                <Heart className={cn("w-4 h-4", post.liked && "fill-current")} />
                                                <span className='font-semibold'>Beğen</span>
                                            </Button>
                                            <Button size="sm" variant="secondary" className="h-8 gap-1.5 rounded-full" onClick={() => handleOpenComments(post)}>
                                                <MessageCircle className="w-4 h-4" />
                                                <span className='font-semibold'>Yorum</span>
                                            </Button>
                                            <Button size="sm" variant="secondary" className="h-8 gap-1.5 rounded-full" onClick={() => handleShare(post)}>
                                                <Share2 className="w-4 h-4" />
                                                <span className="font-semibold">Paylaş</span>
                                            </Button>
                                            <div className='flex-1' />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full"><Bookmark /></Button>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 border-t text-sm text-muted-foreground">
                                    <p><strong className="text-foreground">{post.likes.toLocaleString()}</strong> beğeni</p>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
                            <Users className="w-16 h-16 mb-4 text-muted-foreground/50"/>
                            <p className="text-lg font-semibold">Henüz hiç gönderi yok.</p>
                            <p className="text-sm">Takip ettiğiniz kişiler veya sizin için önerilenler burada görünecek.</p>
                        </div>
                    )}
                </div>
            </div>
            
             <Sheet open={isCommentSheetOpen} onOpenChange={setCommentSheetOpen}>
                <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0"><SheetHeader className="text-center p-4 border-b shrink-0"><SheetTitle>Yorumlar</SheetTitle><SheetClose className="absolute left-4 top-1/2 -translate-y-1/2" /></SheetHeader><ScrollArea className="flex-1"></ScrollArea></SheetContent>
            </Sheet>
        </Suspense>
    );
}

    