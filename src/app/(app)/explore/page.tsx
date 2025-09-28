
'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Heart, MessageCircle, Bookmark, Plus, MoreHorizontal, EyeOff, UserX, Flag, Sparkles, Crown, Trash2, Pencil, Users, Loader2, Home, Shuffle, User, Menu, Share2, Send, X, UserCheck as UserCheckIcon, List, Grid3x3 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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

const ClassicView = ({ posts, handleLikeClick, handleOpenComments, handleShare, handleDeletePost }: { posts: Post[], handleLikeClick: (postId: string) => void, handleOpenComments: (post: Post) => void, handleShare: (post: Post) => void, handleDeletePost: (post: Post) => void }) => {
    const currentUser = auth.currentUser;
    return (
        <div className="mx-auto max-w-lg space-y-4">
            {posts.map((post) => (
                <Card key={post.id} className="w-full overflow-hidden rounded-none border-0 md:rounded-xl">
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {currentUser?.uid === post.authorId ? (
                                        <>
                                            <DropdownMenuItem><Pencil className="mr-2 h-4 w-4"/> Düzenle</DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className='text-destructive focus:text-destructive'>
                                                        <Trash2 className="mr-2 h-4 w-4"/> Sil
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Gönderiyi Sil</AlertDialogTitle>
                                                        <AlertDialogDescription>Bu gönderiyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeletePost(post)} className={cn(buttonVariants({variant: "destructive"}))}>Evet, Sil</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                    ) : (
                                        <>
                                             <DropdownMenuItem><Flag className="mr-2 h-4 w-4"/> Gönderiyi Şikayet Et</DropdownMenuItem>
                                             <DropdownMenuItem><UserX className="mr-2 h-4 w-4"/> {post.user?.name} kişisini engelle</DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                        <div className="p-4 space-y-3">
                             <div className='flex items-center gap-4'>
                                <div className="flex flex-1 items-center justify-around rounded-full bg-muted/50 p-1">
                                    <div className="flex flex-col items-center gap-1">
                                        <Button size="icon" className={cn("h-8 w-8 rounded-full", post.liked && "text-red-500 bg-red-100 dark:bg-red-900/50")} variant="ghost" onClick={() => handleLikeClick(post.id)}>
                                            <Heart className={cn("w-5 h-5", post.liked && "fill-current")} />
                                        </Button>
                                        <span className='text-xs font-semibold text-muted-foreground'>Beğeni</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => handleOpenComments(post)}>
                                            <MessageCircle className="w-5 h-5" />
                                        </Button>
                                        <span className='text-xs font-semibold text-muted-foreground'>Yorum</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => handleShare(post)}>
                                            <Share2 className="w-5 h-5" />
                                        </Button>
                                        <span className='text-xs font-semibold text-muted-foreground'>Paylaş</span>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full"><Bookmark /></Button>
                            </div>
                            <div>
                                {post.likes > 0 && <p className="text-sm font-semibold">{post.likes.toLocaleString()} beğeni</p>}
                                {(post.caption && post.type === 'photo') && (
                                    <p className="text-sm mt-1"><HashtagAndMentionRenderer text={post.caption} /></p>
                                )}
                                {post.commentsCount > 0 && <p className="text-sm mt-1 text-muted-foreground cursor-pointer" onClick={() => handleOpenComments(post)}>{post.commentsCount} yorumun tümünü gör</p>}
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
    
    // Comment Sheet State
    const [isCommentSheetOpen, setCommentSheetOpen] = useState(false);
    const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

    const isMyProfile = (authorId: string) => currentUser?.uid === authorId;
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

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
            
            const likesPromises = commentsSnapshot.docs.map(doc => {
                if(currentUser){
                    return getDoc(doc.ref.collection('likes').doc(currentUser.uid))
                }
                return Promise.resolve(null);
            });
            const likesSnapshot = await Promise.all(likesPromises);

            const fetchedComments: Comment[] = commentsSnapshot.docs.map((doc, index) => {
                const data = doc.data();
                return { 
                    id: doc.id,
                    ...data,
                    user: authorsData[data.authorId],
                    isTranslating: false,
                    isTranslated: false,
                    liked: likesSnapshot[index]?.exists() || false,
                    likes: data.likes || 0,
                } as Comment;
            });
            
            // Basic nesting for replies
            const commentMap = new Map(fetchedComments.map(c => [c.id, {...c, replies: [] as Comment[]} ] as [string, Comment]));
            const nestedComments: Comment[] = [];
            for(const comment of fetchedComments) {
                if(comment.parentId && commentMap.has(comment.parentId)) {
                    const parent = commentMap.get(comment.parentId);
                    parent?.replies?.push(comment as Comment);
                } else {
                    nestedComments.push(comment as Comment);
                }
            }
            setComments(nestedComments);

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
                likes: 0,
                parentId: replyingTo ? replyingTo.id : null,
            };
            
            const newCommentDocRef = await addDoc(commentsRef, newCommentData);
            await updateDoc(postRef, { commentsCount: increment(1) });
            
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const newCommentForUI: Comment = {
                ...newCommentData,
                id: newCommentDocRef.id,
                user: userDoc.data() as User,
                isTranslating: false,
                isTranslated: false,
                liked: false,
                replies: [],
                createdAt: { toDate: () => new Date() }
            };

            if (replyingTo) {
                 setComments(prev => prev.map(c => {
                    if (c.id === replyingTo.id) {
                        return {...c, replies: [newCommentForUI, ...(c.replies || [])]};
                    }
                    return c;
                }));
            } else {
                 setComments(prev => [newCommentForUI, ...prev]);
            }
           
            setPosts(prev => prev.map(p => p.id === activePostForComments.id ? { ...p, commentsCount: p.commentsCount + 1 } : p));
            setCommentText('');
            setReplyingTo(null);

        } catch(error) {
            console.error("Error posting comment:", error);
            toast({ variant: 'destructive', title: 'Yorum gönderilemedi.' });
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleReplyTo = (comment: Comment) => {
        setReplyingTo({ id: comment.id, name: comment.user?.name || 'Kullanıcı' });
        commentInputRef.current?.focus();
    };

    const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
        if (!activePostForComments) return;
        
        try {
            await deleteDoc(doc(db, 'posts', activePostForComments.id, 'comments', commentId));
            await updateDoc(doc(db, 'posts', activePostForComments.id), { commentsCount: increment(-1) });

            // Optimistic UI update
            if(parentId) {
                setComments(prev => prev.map(c => 
                    c.id === parentId ? {...c, replies: c.replies?.filter(r => r.id !== commentId)} : c
                ));
            } else {
                setComments(prev => prev.filter(c => c.id !== commentId));
            }

            toast({ title: "Yorum silindi."});
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast({ variant: "destructive", title: "Yorum silinemedi."});
        }
    };

    const handleLikeComment = async (commentId: string) => {
         if (!activePostForComments || !currentUser) return;

         const commentRef = doc(db, 'posts', activePostForComments.id, 'comments', commentId);
         const likeRef = doc(commentRef, 'likes', currentUser.uid);

         const updateLikeState = (commentsList: Comment[]): Comment[] => {
            return commentsList.map(c => {
                if (c.id === commentId) {
                    return {...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1};
                }
                if (c.replies) {
                    return {...c, replies: updateLikeState(c.replies)};
                }
                return c;
            })
         };
        setComments(prev => updateLikeState(prev));
         
        try {
            await runTransaction(db, async (transaction) => {
                const likeDoc = await transaction.get(likeRef);
                if (likeDoc.exists()) {
                    transaction.delete(likeRef);
                    transaction.update(commentRef, { likes: increment(-1) });
                } else {
                    transaction.set(likeRef, { likedAt: serverTimestamp() });
                    transaction.update(commentRef, { likes: increment(1) });
                }
            });
        } catch (error) {
            console.error("Error liking comment", error);
            // Revert UI on error
            setComments(prev => updateLikeState(prev));
        }
    };

    const CommentItem = ({ comment, onReply, onDelete, onLike }: { comment: Comment, onReply: (c: Comment) => void, onDelete: (id: string, parentId?: string | null) => void, onLike: (id: string) => void}) => (
        <div className="flex items-start gap-3">
            <Link href={`/profile/${comment.user?.username}`}><Avatar className="w-8 h-8"><AvatarImage src={comment.user?.avatarUrl} /><AvatarFallback>{comment.user?.name?.charAt(0)}</AvatarFallback></Avatar></Link>
            <div className="flex-1">
                <p className="text-sm">
                    <Link href={`/profile/${comment.user?.username}`} className="font-semibold">{comment.user?.name}</Link>{' '}
                    <HashtagAndMentionRenderer text={comment.text} />
                </p>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                    <span>{formatRelativeTime(comment.createdAt?.toDate())}</span>
                    <button className="font-semibold" onClick={() => onReply(comment)}>Yanıtla</button>
                    {comment.likes > 0 && <span className="font-semibold">{comment.likes} beğenme</span>}
                </div>
            </div>
            <div className='flex items-center'>
                 <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => onLike(comment.id)}>
                    <Heart className={cn("w-4 h-4", comment.liked && "text-red-500 fill-current")} />
                </Button>
                {(isMyProfile(comment.authorId) || (activePostForComments && isMyProfile(activePostForComments.authorId))) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="w-8 h-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(comment.id, comment.parentId)}>Sil</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
    
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
                            <div key={comment.id}>
                               <CommentItem comment={comment} onReply={handleReplyTo} onDelete={handleDeleteComment} onLike={handleLikeComment}/>
                               <div className="pl-8 mt-4 space-y-4 border-l ml-4">
                                {comment.replies?.map(reply => <CommentItem key={reply.id} comment={reply} onReply={handleReplyTo} onDelete={handleDeleteComment} onLike={handleLikeComment} />)}
                               </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className='text-center text-muted-foreground p-10'>Henüz yorum yok. İlk yorumu sen yap!</p>
                )}
            </ScrollArea>
             <div className="p-4 border-t shrink-0 bg-background">
                {replyingTo && (
                    <div className='text-sm text-muted-foreground mb-2 flex justify-between items-center bg-muted p-2 rounded-md'>
                        <span>@{replyingTo.name} kişisine yanıt veriliyor...</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}><X className="h-4 w-4"/></Button>
                    </div>
                )}
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

    const handleDeletePost = async (post: Post) => {
        try {
            await deleteDoc(doc(db, 'posts', post.id));
            if (post.url) {
                const imageRef = ref(storage, post.url);
                await deleteObject(imageRef);
            }
            setPosts(prev => prev.filter(p => p.id !== post.id));
            toast({ title: "Gönderi silindi." });
        } catch (e) {
            console.error("Error deleting post:", e);
            toast({ variant: "destructive", title: "Gönderi silinemedi." });
        }
    };
    
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
      
      const updatedPosts = [...posts];
      updatedPosts[postIndex] = { ...post, liked: newLikedState, likes: newLikesCount };
      setPosts(updatedPosts);
      
      const postRef = doc(db, 'posts', postId);
      const likeRef = doc(postRef, 'likes', currentUser.uid);

      try {
        await runTransaction(db, async (transaction) => {
          const likeDoc = await transaction.get(likeRef);
          if (likeDoc.exists()) {
            transaction.delete(likeRef);
            transaction.update(postRef, { likes: increment(-1) });
          } else {
            transaction.set(likeRef, { likedAt: serverTimestamp(), userName: currentUser.displayName, userAvatar: currentUser.photoURL });
            transaction.update(postRef, { likes: increment(1) });
          }
        });
      } catch (error) {
        console.error("Error toggling like:", error);
        setPosts(posts);
        toast({ title: 'Beğenme işlemi başarısız oldu.', variant: 'destructive' });
      }
    };

    const handleShare = async (post: Post) => {
        const shareData = {
            title: `BeMatch'te bir gönderi`,
            text: post.caption || post.textContent || `Bu harika gönderiye göz at!`,
            url: window.location.origin + `/post/${post.id}`, // Specific post URL
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
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
                    <ClassicView posts={posts} handleLikeClick={handleLikeClick} handleOpenComments={handleOpenComments} handleShare={handleShare} handleDeletePost={handleDeletePost} />
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



    