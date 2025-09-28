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

// --- CLASSIC VIEW COMPONENT ---
const ClassicView = ({ posts, loading, handleLikeClick, handleOpenComments, handleDeletePost }: { posts: Post[], loading: boolean, handleLikeClick: (postId: string) => void, handleOpenComments: (post:Post) => void, handleDeletePost: (post:Post) => void }) => {
    const currentUser = auth.currentUser;
    const isMyProfile = (authorId: string) => currentUser?.uid === authorId;

    return (
        <div className="w-full pb-20 md:pb-0">
            <div className="mx-auto max-w-lg space-y-4">
                {loading ? (
                    <PostSkeleton />
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <Card key={post.id} className="w-full overflow-hidden shadow-sm border-b md:rounded-xl md:border">
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
                                <div className="p-4 space-y-2">
                                     {post.type === 'text' && post.textContent && <p className="text-sm"><HashtagAndMentionRenderer text={post.textContent} /></p>}
                                     {post.caption && <p className="text-sm"><HashtagAndMentionRenderer text={post.caption} /></p>}
                                    <div className='flex items-center gap-2 pt-2'>
                                        <Button size="sm" className={cn("h-8 gap-1.5 rounded-full", post.liked && "text-red-500")} variant="secondary" onClick={() => handleLikeClick(post.id)}>
                                            <Heart className={cn("w-4 h-4", post.liked && "fill-current")} />
                                            <span className='font-semibold'>Beğen</span>
                                        </Button>
                                        <Button size="sm" variant="secondary" className="h-8 gap-1.5 rounded-full" onClick={() => handleOpenComments(post)}>
                                            <MessageCircle className="w-4 h-4" />
                                            <span className='font-semibold'>Yorum</span>
                                        </Button>
                                        <Button size="sm" variant="secondary" className="h-8 gap-1.5 rounded-full">
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
    );
};


// --- IMMERSIVE VIEW COMPONENT ---
const ImmersiveView = ({ posts, loading, handleLikeClick, handleOpenComments, handleDeletePost, showLikeAnimation }: { posts: Post[], loading: boolean, handleLikeClick: (postId: string) => void, handleOpenComments: (post:Post) => void, handleDeletePost: (post:Post) => void, showLikeAnimation: string | null }) => {
    const currentUser = auth.currentUser;
    const isMyProfile = (authorId: string) => currentUser?.uid === authorId;
    const [showNav, setShowNav] = useState(false);

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center bg-black"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
    }

    return (
        <div className="w-full h-screen bg-black text-white snap-y snap-mandatory overflow-y-scroll overflow-x-hidden">
             {/* --- Navigation Toggle Button --- */}
            <div className="absolute top-4 left-4 z-30">
                <Button size="icon" variant="ghost" className="bg-black/40 text-white hover:bg-white/20 hover:text-white rounded-full" onClick={() => setShowNav(!showNav)}>
                    <Menu className="w-6 h-6"/>
                </Button>
            </div>
            {posts.length > 0 ? (
                posts.map((post) => (
                    <div key={post.id} className="h-screen w-full relative snap-center flex items-center justify-center">
                        <AnimatePresence>
                            {showLikeAnimation === post.id && (
                                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                    <Heart className="w-24 h-24 text-red-500 drop-shadow-lg" fill="currentColor" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {post.type === 'photo' && post.url ? (
                            <Image src={post.url} alt={post.caption || `Post by ${post.user?.name}`} fill className="object-contain" data-ai-hint={post.aiHint} onDoubleClick={() => handleLikeClick(post.id)} />
                        ) : post.type === 'text' && post.textContent ? (
                            <div className="p-8 text-center flex items-center justify-center h-full w-full bg-black">
                                <p className="text-2xl md:text-3xl font-bold whitespace-pre-wrap break-words max-w-xl text-white">
                                    <HashtagAndMentionRenderer text={post.textContent} className="text-white" />
                                </p>
                            </div>
                        ) : null}

                        <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/40" onClick={() => showNav && setShowNav(false)}>
                            <header className="flex justify-between items-start pointer-events-auto">
                                <div className="flex items-center gap-3">
                                    <Link href={`/profile/${post.user?.username}`}>
                                        <Avatar className="w-12 h-12 border-2 border-white">
                                            <AvatarImage src={post.user?.avatarUrl} />
                                            <AvatarFallback>{post.user?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div>
                                        <Link href={`/profile/${post.user?.username}`} className="font-bold text-base flex items-center gap-2">
                                            {post.user?.name}
                                            {post.user?.isPremium && <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                                        </Link>
                                        <p className="text-sm text-white/80">{formatRelativeTime(post.createdAt?.toDate())}</p>
                                    </div>
                                    {!isMyProfile(post.authorId) && <Button size="sm" variant="secondary" className="ml-2">Takip Et</Button>}
                                </div>
                            </header>

                            <footer className="flex justify-between items-end pointer-events-auto">
                                <div className="flex-1 space-y-2 text-shadow-lg pr-12">
                                     {post.caption && <p className="text-sm"><HashtagAndMentionRenderer text={post.caption} className="text-white" /></p>}
                                     {post.type === 'text' && post.textContent && <p className="text-sm"><HashtagAndMentionRenderer text={post.textContent} className="text-white" /></p>}
                                </div>
                                <div className="flex flex-col items-center space-y-5">
                                    <button className="flex flex-col items-center" onClick={() => handleLikeClick(post.id)}>
                                        <div className={cn("bg-black/40 p-3 rounded-full", post.liked && "bg-red-500/80")}><Heart className={cn("w-7 h-7", post.liked && "fill-white text-white")} /></div>
                                        <span className="text-xs font-bold mt-1">{post.likes || 0}</span>
                                    </button>
                                    <button className="flex flex-col items-center" onClick={() => handleOpenComments(post)}>
                                        <div className="bg-black/40 p-3 rounded-full"><MessageCircle className="w-7 h-7" /></div>
                                        <span className="text-xs font-bold mt-1">{post.commentsCount || 0}</span>
                                    </button>
                                    <button className="flex flex-col items-center"><div className="bg-black/40 p-3 rounded-full"><Send className="w-7 h-7" /></div><span className="text-xs font-bold mt-1">Paylaş</span></button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><button className="flex flex-col items-center"><div className="bg-black/40 p-3 rounded-full"><MoreHorizontal className="w-7 h-7" /></div></button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {post.authorId === currentUser?.uid ? (
                                                <DropdownMenuItem onClick={() => handleDeletePost(post)}><Trash2 className="mr-2 h-4 w-4 text-destructive"/><span className="text-destructive">Gönderiyi Sil</span></DropdownMenuItem>
                                            ) : (
                                                <>
                                                    <DropdownMenuItem><Flag className="mr-2 h-4 w-4"/> Şikayet Et</DropdownMenuItem>
                                                    <DropdownMenuItem><EyeOff className="mr-2 h-4 w-4"/> Bu Gönderiyi Gizle</DropdownMenuItem>
                                                    <DropdownMenuItem><UserX className="mr-2 h-4 w-4"/> {post.user?.name} Adlı Kullanıcıyı Engelle</DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </footer>
                        </div>
                    </div>
                ))
            ) : (
                <div className="h-screen w-full flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50"/>
                    <p className="text-lg font-semibold">Henüz hiç gönderi yok.</p>
                    <p className="text-sm">Takip ettiğiniz kişiler veya sizin için önerilenler burada görünecek.</p>
                </div>
            )}
             {/* --- Navigation Overlay --- */}
             <AnimatePresence>
                {showNav && (
                     <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "tween", ease: "circOut", duration: 0.3 }}
                        className="fixed bottom-0 left-0 right-0 z-20 p-2 pointer-events-auto"
                    >
                         <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-full h-14 flex items-center justify-around text-white">
                            <Link href="/explore" className="flex flex-col items-center text-primary"><Home className="w-6 h-6"/><span className="text-xs">Akış</span></Link>
                            <Link href="/shuffle" className="flex flex-col items-center"><Shuffle className="w-6 h-6"/><span className="text-xs">Eşleş</span></Link>
                            <Link href="/chat" className="flex flex-col items-center"><MessageCircle className="w-6 h-6"/><span className="text-xs">Sohbet</span></Link>
                             <Link href={currentUser ? `/profile/${currentUser.displayName}` : '/login'} className="flex flex-col items-center"><User className="w-6 h-6"/><span className="text-xs">Profil</span></Link>
                         </div>
                     </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
export default function ExplorePage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const currentUser = auth.currentUser;
    const [showLikeAnimation, setShowLikeAnimation] = useState<string | null>(null);
    const [isCommentSheetOpen, setCommentSheetOpen] = useState(false);
    const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    
    const [viewMode, setViewMode] = useState<'classic' | 'immersive' | null>(null);

     useEffect(() => {
        // This effect runs only on the client
        const savedViewMode = localStorage.getItem('exploreViewMode') as 'classic' | 'immersive' | null;
        setViewMode(savedViewMode || 'classic'); // Default to classic if nothing is saved
    }, []);

    const handleOpenComments = (post: Post) => {
        if (!isCommentSheetOpen) {
            setActivePostForComments(post);
            setCommentSheetOpen(true);
            // Fetching logic would go here
        }
    };
    const handleDeletePost = (post: Post) => { /* ... */ };
    const handleLikeClick = (postId: string) => { /* ... */ };


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

    if (viewMode === null) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }

    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            {viewMode === 'immersive' ? (
                <ImmersiveView posts={posts} loading={loading} handleLikeClick={handleLikeClick} handleOpenComments={handleOpenComments} handleDeletePost={handleDeletePost} showLikeAnimation={showLikeAnimation} />
            ) : (
                <ClassicView posts={posts} loading={loading} handleLikeClick={handleLikeClick} handleOpenComments={handleOpenComments} handleDeletePost={handleDeletePost} />
            )}
            
             <Sheet open={isCommentSheetOpen} onOpenChange={setCommentSheetOpen}>
                <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0"><SheetHeader className="text-center p-4 border-b shrink-0"><SheetTitle>Yorumlar</SheetTitle><SheetClose className="absolute left-4 top-1/2 -translate-y-1/2" /></SheetHeader><ScrollArea className="flex-1"></ScrollArea></SheetContent>
            </Sheet>
        </Suspense>
    );
}
