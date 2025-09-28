
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
    <Card className="w-full rounded-none md:rounded-xl shadow-none border-b-0 md:border-b mb-4">
        <CardContent className="p-0">
            <div className="flex items-center gap-4 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
            <Skeleton className="aspect-square w-full" />
        </CardContent>
    </Card>
);

const ClassicView = ({ posts, handleLikeClick, handleOpenComments, handleShare }: { posts: Post[], handleLikeClick: (postId: string) => void, handleOpenComments: (post: Post) => void, handleShare: (post: Post) => void }) => {
    return (
        <div className="mx-auto max-w-lg space-y-4">
            {posts.map((post) => (
                <Card key={post.id} className="w-full overflow-hidden rounded-none md:rounded-xl shadow-none border-0 md:border">
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
                             {(post.caption && post.type === 'photo') && (
                                <p className="text-sm"><HashtagAndMentionRenderer text={post.caption} /></p>
                            )}
                            <div className='flex items-center gap-2 pt-2'>
                                <Button size="sm" className={cn("h-8 gap-1.5 rounded-full", post.liked && "text-red-500")} variant="secondary" onClick={() => handleLikeClick(post.id)}>
                                    <Heart className={cn("w-4 h-4", post.liked && "fill-current")} />
                                    <span className='font-semibold'>{post.likes}</span>
                                </Button>
                                <Button size="sm" variant="secondary" className="h-8 gap-1.5 rounded-full" onClick={() => handleOpenComments(post)}>
                                    <MessageCircle className="w-4 h-4" />
                                    <span className='font-semibold'>{post.commentsCount > 0 ? post.commentsCount : ''}</span>
                                </Button>
                                <Button size="sm" variant="secondary" className="h-8 gap-1.5 rounded-full" onClick={() => handleShare(post)}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <div className='flex-1' />
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full"><Bookmark /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function ExplorePage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const currentUser = auth.currentUser;
    const [isCommentSheetOpen, setCommentSheetOpen] = useState(false);
    const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);

    const isMyProfile = (authorId: string) => currentUser?.uid === authorId;

    const handleOpenComments = async (post: Post) => {
        if (isCommentSheetOpen) return;
        setActivePostForComments(post);
        setCommentSheetOpen(true);
        setIsCommentsLoading(true);
        setComments([]);
        try {
            const commentsQuery = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'desc'));
            const commentsSnapshot = await getDocs(commentsQuery);
            if (commentsSnapshot.empty) {
                 setIsCommentsLoading(false);
                 return;
            }

            const authorIds = [...new Set(commentsSnapshot.docs.map(doc => doc.data().authorId))];
            const authorsData: Record<string, User> = {};
            if(authorIds.length > 0) {
                 const authorsQuery = query(collection(db, 'users'), where(documentId(), 'in', authorIds));
                const authorsSnapshot = await getDocs(authorsQuery);
                authorsSnapshot.forEach(doc => {
                    authorsData[doc.id] = { ...doc.data(), uid: doc.id } as User;
                });
            }

            const fetchedComments = commentsSnapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id,
                    ...data,
                    user: authorsData[data.authorId],
                    isTranslating: false,
                    isTranslated: false
                } as Comment;
            });
            setComments(fetchedComments);

        } catch (error) {
            console.error("Error fetching comments:", error);
            toast({ variant: 'destructive', title: 'Yorumlar yüklenemedi.' });
        } finally {
            setIsCommentsLoading(false);
        }
    };
    
    const handlePostComment = async () => {
        if (!commentText.trim() || !currentUser || !activePostForComments) return;
        setIsPostingComment(true);

        try {
            const postRef = doc(db, 'posts', activePostForComments.id);
            const commentsRef = collection(postRef, 'comments');
            
            const newCommentData = {
                authorId: currentUser.uid,
                text: commentText,
                createdAt: serverTimestamp(),
                likes: 0
            };
            
            const newCommentDocRef = await addDoc(commentsRef, newCommentData);
            
            await runTransaction(db, async (transaction) => {
                transaction.update(postRef, { commentsCount: increment(1) });
            });
            
            // Optimistic UI update
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const newCommentForUI: Comment = {
                ...newCommentData,
                id: newCommentDocRef.id,
                user: userDoc.data() as User,
                isTranslating: false,
                isTranslated: false,
                liked: false
            };
            setComments(prev => [newCommentForUI, ...prev]);
            setActivePostForComments(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
            setPosts(prev => prev.map(p => p.id === activePostForComments.id ? { ...p, commentsCount: p.commentsCount + 1 } : p));
            setCommentText('');

        } catch(error) {
            console.error("Error posting comment:", error);
            toast({ variant: 'destructive', title: 'Yorum gönderilemedi.' });
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleTranslateComment = async (commentId: string) => {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, isTranslating: true } : c));
        try {
            const comment = comments.find(c => c.id === commentId);
            if (!comment?.text) return;
            
            const result = await translateText({ textToTranslate: comment.text });
            if (result.translatedText) {
                 setComments(prev => prev.map(c => c.id === commentId ? { ...c, text: result.translatedText, originalText: c.text, isTranslated: true, lang: result.sourceLanguage, isTranslating: false } : c));
            } else if (result.sourceLanguage === 'tr') {
                toast({ title: 'Bu yorum zaten Türkçe.' });
                 setComments(prev => prev.map(c => c.id === commentId ? { ...c, isTranslating: false } : c));
            } else {
                 throw new Error(result.error || 'Çeviri başarısız.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Çeviri hatası', description: error.message });
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, isTranslating: false } : c));
        }
    };
    
    const revertTranslation = (commentId: string) => {
        setComments(prev => prev.map(c => c.id === commentId && c.originalText ? { ...c, text: c.originalText, originalText: undefined, isTranslated: false, lang: undefined } : c));
    };

    const CommentSheetContent = () => (
        <>
            <SheetHeader className="text-center p-4 border-b shrink-0">
                <SheetTitle>Yorumlar</SheetTitle>
                <SheetClose className="absolute left-4 top-1/2 -translate-y-1/2" />
            </SheetHeader>
            <ScrollArea className="flex-1">
                {isCommentsLoading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
                ) : comments.length > 0 ? (
                    <div className='p-4 space-y-4'>
                        {comments.map(comment => (
                            <div key={comment.id} className="flex items-start gap-3">
                                <Link href={`/profile/${comment.user?.username}`}><Avatar className="w-8 h-8"><AvatarImage src={comment.user?.avatarUrl} /><AvatarFallback>{comment.user?.name?.charAt(0)}</AvatarFallback></Avatar></Link>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        <Link href={`/profile/${comment.user?.username}`} className="font-semibold">{comment.user?.name}</Link>{' '}
                                        <HashtagAndMentionRenderer text={comment.text} />
                                    </p>
                                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                        <span>{formatRelativeTime(comment.createdAt?.toDate())}</span>
                                        <button className="font-semibold" disabled={comment.isTranslating}>
                                            {comment.isTranslating ? 'Çevriliyor...' : !comment.isTranslated ? 'Çevir' : 'Orijinali Gör'}
                                        </button>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="w-8 h-8"><Heart className="w-4 h-4"/></Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className='text-center text-muted-foreground p-10'>Henüz yorum yok. İlk yorumu sen yap!</p>
                )}
            </ScrollArea>
             <div className="p-4 border-t shrink-0 bg-background">
                <div className="flex items-center gap-2">
                     {currentUser && <Avatar className="w-9 h-9"><AvatarImage src={currentUser.photoURL || ''} /><AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback></Avatar>}
                    <MentionTextarea 
                        value={commentText}
                        setValue={setCommentText}
                        placeholder="Yorum ekle..."
                        isInput
                        onEnterPress={handlePostComment}
                    />
                    <Button onClick={handlePostComment} disabled={!commentText.trim() || isPostingComment}>
                        {isPostingComment ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Paylaş'}
                    </Button>
                </div>
            </div>
        </>
    );

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
                {loading ? (
                    <PostSkeleton />
                ) : posts.length > 0 ? (
                    <ClassicView posts={posts} handleLikeClick={handleLikeClick} handleOpenComments={handleOpenComments} handleShare={handleShare} />
                ) : (
                    <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
                        <Users className="w-16 h-16 mb-4 text-muted-foreground/50"/>
                        <p className="text-lg font-semibold">Henüz hiç gönderi yok.</p>
                        <p className="text-sm">Takip ettiğiniz kişiler veya sizin için önerilenler burada görünecek.</p>
                    </div>
                )}
            </div>
            
             <Sheet open={isCommentSheetOpen} onOpenChange={setCommentSheetOpen}>
                <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
                    <CommentSheetContent />
                </SheetContent>
            </Sheet>
        </Suspense>
    );
}

    

    