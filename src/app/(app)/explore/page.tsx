
'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Heart, MessageCircle, Bookmark, Plus, Send, Loader2, Languages, Lock, MoreHorizontal, EyeOff, UserX, Flag, Sparkles, Image as ImageIcon, Type, X as XIcon, Check, Wand2, Gem, Trash2, Pencil, MapPin, ArrowLeft, Smile, Mic, ListCollapse, Music, Hash, Globe, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translateText } from '@/ai/flows/translate-text-flow';
import { stylizeImage } from '@/ai/flows/stylize-image-flow';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, getDocs, doc, getDoc, DocumentData, writeBatch, arrayUnion, updateDoc, increment, addDoc, serverTimestamp, where, documentId, arrayRemove, runTransaction, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadString, deleteObject } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { MentionTextarea } from '@/components/ui/mention-textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { awardXp } from '@/ai/flows/award-xp-flow';
import { LevelBadge } from '@/components/ui/level-badge';
import { getXpForAction } from '@/config/xp-config';


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

const HashtagAndMentionRenderer = ({ text }: { text: string }) => {
    if (!text) return null;
    const parts = text.split(/([#@]\w+)/g);
    return (
        <React.Fragment>
            {parts.map((part, i) => {
                if (part.startsWith('#')) {
                    return (
                        <Link key={i} href={`/tag/${part.substring(1)}`} className="text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>
                            {part}
                        </Link>
                    );
                }
                if (part.startsWith('@')) {
                     return (
                        <Link key={i} href={`/profile/${part.substring(1)}`} className="text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>
                            {part}
                        </Link>
                    );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </React.Fragment>
    );
};

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
  originalText?: string;
  lang?: string;
  isTranslating?: boolean;
  isTranslated?: boolean;
  likes: number;
  liked: boolean;
  createdAt: any; // Can be Timestamp or Date
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
  isTranslated?: boolean;
  isTranslating?: boolean;
  likes: number;
  commentsCount: number;
  liked: boolean;
  comments: Comment[];
  isGalleryLocked?: boolean; 
  isAiEdited?: boolean;
  location?: string;
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
    const { toast } = useToast();
    const router = useRouter();
    const currentUser = auth.currentUser;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createFileInputRef = useRef<HTMLInputElement>(null);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const [isCommentSheetOpen, setCommentSheetOpen] = useState(false);
    const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [isPostingComment, setIsPostingComment] = useState(false);

    const [isLikesDialogVisible, setIsLikesDialogVisible] = useState(false);
    const [likers, setLikers] = useState<User[]>([]);
    const [isLikersLoading, setIsLikersLoading] = useState(false);

    // Create/Edit Post States
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [postContent, setPostContent] = useState('');
    const [postImage, setPostImage] = useState<string | null>(null);
    const [postLocation, setPostLocation] = useState('');
    const [isPostProcessing, setIsPostProcessing] = useState(false);
    const postContentMaxLength = 1000;


    useEffect(() => {
        const fetchPostsAndAuthors = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(postsQuery);
                const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

                if (postsData.length === 0) {
                    setPosts([]);
                    setLoading(false);
                    return;
                }

                const authorIds = [...new Set(postsData.map(p => p.authorId).filter(id => !!id))];
                const authorsData: Record<string, User> = {};
                
                if(authorIds.length > 0) {
                    const authorsQuery = query(collection(db, 'users'), where('uid', 'in', authorIds));
                    const authorsSnapshot = await getDocs(authorsQuery);
                    authorsSnapshot.forEach(doc => {
                        authorsData[doc.data().uid] = { ...doc.data(), uid: doc.id } as User;
                    });
                }
                
                const postIds = postsData.map(p => p.id);
                // A better approach would be a user-centric likes collection, but for this scope, we fetch likes for each post individually or skip it on initial load.
                // For performance, we'll fetch likes individually on click.

                const populatedPosts = await Promise.all(
                    postsData.map(async (post) => {
                        let isGalleryLocked = false;
                        const authorData = authorsData[post.authorId];

                        if (authorData) {
                            if (post.type === 'photo' && authorData.isGalleryPrivate && post.authorId !== currentUser.uid) {
                                const permissionDocRef = doc(db, 'users', post.authorId, 'galleryPermissions', currentUser.uid);
                                const permissionDocSnap = await getDoc(permissionDocRef);
                                if (!permissionDocSnap.exists()) {
                                    isGalleryLocked = true;
                                }
                            }
                        }
                        
                        const likeDocRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
                        const likeDocSnap = await getDoc(likeDocRef);

                        return { ...post, user: authorData, comments: [], isGalleryLocked, liked: likeDocSnap.exists() };
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

        fetchPostsAndAuthors();
    }, [toast, currentUser]);

    const handleLikeClick = async (postId: string) => {
        if (!currentUser) return;
        
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;
    
        const post = posts[postIndex];
        const newLikedState = !post.liked;
        const newLikesCount = newLikedState ? post.likes + 1 : post.likes - 1;
    
        setPosts(prevPosts => {
            const newPosts = [...prevPosts];
            newPosts[postIndex] = { ...post, liked: newLikedState, likes: newLikesCount };
            return newPosts;
        });

        try {
            await runTransaction(db, async (transaction) => {
                 const postRef = doc(db, "posts", postId);
                 const likeRef = doc(postRef, "likes", currentUser.uid);
                 
                 const postSnap = await transaction.get(postRef);
                 if (!postSnap.exists()) {
                     throw "Post does not exist!";
                 }
                 
                 if (newLikedState) { // Liking
                    transaction.set(likeRef, { likedAt: serverTimestamp() });
                    transaction.update(postRef, { likes: increment(1) });
                    
                    if (post.authorId !== currentUser.uid) {
                        const notificationRef = doc(collection(db, 'notifications'));
                        transaction.set(notificationRef, {
                            recipientId: post.authorId,
                            fromUser: {
                                uid: currentUser.uid,
                                name: currentUser.displayName,
                                avatar: currentUser.photoURL,
                            },
                            type: 'like',
                            postType: post.type,
                            postId: postId,
                            read: false,
                            createdAt: serverTimestamp()
                        });
                        // Award XP to post author for receiving a like
                        awardXp({ userId: post.authorId, reason: 'LIKE_RECEIVED' });
                    }
                     // Award XP to self for liking a post
                    awardXp({ userId: currentUser.uid, reason: 'LIKE_SENT' });

                 } else { // Unliking
                     transaction.delete(likeRef);
                     transaction.update(postRef, { likes: increment(-1) });
                 }
            });

        } catch (error) {
            console.error("Error updating like:", error);
            setPosts(prevPosts => {
                const newPosts = [...prevPosts];
                newPosts[postIndex] = post; // Revert UI change
                return newPosts;
            });
            toast({ variant: 'destructive', title: 'Beğenme işlemi başarısız oldu.' });
        }
    };
    
    const handleOpenComments = async (post: Post) => {
        if (!isCommentSheetOpen) {
            setActivePostForComments(post);
            setCommentSheetOpen(true);
            setIsCommentsLoading(true);
            try {
                const commentsQuery = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'desc'));
                const commentsSnapshot = await getDocs(commentsQuery);
                
                const commentAuthors = new Set(commentsSnapshot.docs.map(d => d.data().authorId));
                let authorDetails: Record<string, User> = {};

                if (commentAuthors.size > 0) {
                    const usersQuery = query(collection(db, 'users'), where('uid', 'in', Array.from(commentAuthors)));
                    const usersSnapshot = await getDocs(usersQuery);
                    usersSnapshot.forEach(doc => {
                         authorDetails[doc.data().uid] = { ...doc.data(), uid: doc.id } as User;
                    });
                }
                
                const comments = commentsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        user: authorDetails[data.authorId]
                    } as Comment
                });

                setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? { ...p, comments } : p));
                
            } catch (error) {
                 console.error("Error fetching comments:", error);
                 toast({ variant: 'destructive', title: "Yorumlar alınamadı." });
            } finally {
                setIsCommentsLoading(false);
            }
        }
    };

    const handlePostComment = async () => {
        if (!currentUser || !activePostForComments || !commentInput.trim()) return;
        
        setIsPostingComment(true);

        const newCommentData = {
            authorId: currentUser.uid,
            text: commentInput.trim(),
            likes: 0,
            createdAt: serverTimestamp()
        };

        try {
            const postRef = doc(db, "posts", activePostForComments.id);
            const commentsRef = collection(postRef, 'comments');
            
            const newCommentRef = await addDoc(commentsRef, newCommentData);
            await updateDoc(postRef, { commentsCount: increment(1) });
            
             // Award XP
            if (activePostForComments.authorId !== currentUser.uid) {
                awardXp({ userId: activePostForComments.authorId, reason: 'COMMENT_RECEIVED' });
            }
            awardXp({ userId: currentUser.uid, reason: 'COMMENT_SENT' });
            
             // Create notification
             if (activePostForComments.authorId !== currentUser.uid) {
                const notificationRef = doc(collection(db, 'notifications'));
                await setDoc(notificationRef, {
                    recipientId: activePostForComments.authorId,
                    fromUser: {
                        uid: currentUser.uid,
                        name: currentUser.displayName,
                        avatar: currentUser.photoURL,
                    },
                    type: 'comment',
                    postType: activePostForComments.type,
                    postId: activePostForComments.id,
                    content: newCommentData.text.substring(0, 50),
                    read: false,
                    createdAt: serverTimestamp()
                });
            }

            // UI update
            const newCommentForUI = {
                ...newCommentData,
                id: newCommentRef.id,
                user: { uid: currentUser.uid, name: currentUser.displayName || 'Siz', avatarUrl: currentUser.photoURL || '', username: currentUser.email?.split('@')[0] || 'user' },
                createdAt: new Date(),
                liked: false,
            };
            
             setPosts(prevPosts => prevPosts.map(p => p.id === activePostForComments.id ? { 
                ...p, 
                comments: [newCommentForUI, ...p.comments],
                commentsCount: p.commentsCount + 1,
            } : p));
            setActivePostForComments(prev => prev ? { 
                ...prev, 
                comments: [newCommentForUI, ...prev.comments],
                commentsCount: prev.commentsCount + 1
             } : null);

            setCommentInput('');
            
        } catch(error) {
            console.error("Error posting comment:", error);
            toast({ variant: 'destructive', title: "Yorum gönderilemedi." });
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleOpenLikes = async (postId: string) => {
        setIsLikesDialogVisible(true);
        setIsLikersLoading(true);
        setLikers([]);
        try {
            const likesQuery = query(collection(db, 'posts', postId, 'likes'));
            const likesSnapshot = await getDocs(likesQuery);
            const likerIds = likesSnapshot.docs.map(d => d.id);
            
            if (likerIds.length === 0) {
                setIsLikersLoading(false);
                return;
            }
            
            const usersQuery = query(collection(db, 'users'), where('uid', 'in', likerIds));
            const usersSnapshot = await getDocs(usersQuery);
            const usersData = usersSnapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User));
            setLikers(usersData);
        } catch(error) {
            console.error("Error fetching likers:", error);
            toast({ variant: 'destructive', title: 'Beğenenler listesi alınamadı.' });
        } finally {
            setIsLikersLoading(false);
        }
    };


    const handleCommentLikeClick = (postId: string, commentId: string) => {
        // This is a UI-only optimistic update. 
        // For a real app, this should be backed by a Firestore transaction.
        const updatedPosts = posts.map(post => {
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
        });
        setPosts(updatedPosts);
        setActivePostForComments(updatedPosts.find(p => p.id === postId) || null);
    };
    

    const handleAddEmoji = (emoji: string) => setCommentInput(prevInput => prevInput + emoji);
    
    const handleReply = (username: string) => { 
        setCommentInput(prev => `@${username} ${prev}`); 
    };
    
    const handleDeletePost = async (post: Post) => {
        if (!currentUser || post.authorId !== currentUser.uid) return;
        
        try {
            // Delete from Firestore
            await deleteDoc(doc(db, "posts", post.id));

            // If it's a photo, delete from Storage
            if (post.type === 'photo' && post.url) {
                const imageRef = ref(storage, post.url);
                await deleteObject(imageRef).catch((error) => {
                    if (error.code !== 'storage/object-not-found') {
                        throw error;
                    }
                });
            }
            
            setPosts(prev => prev.filter(p => p.id !== post.id));
            toast({ title: "Gönderi silindi." });
        } catch (error) {
            console.error("Error deleting post:", error);
            toast({ variant: 'destructive', title: "Gönderi silinirken hata oluştu." });
        }
    };

    // --- Create / Edit Post Logic ---

    const resetCreateState = () => {
        setPostContent('');
        setPostImage(null);
        setPostLocation('');
        setIsPostProcessing(false);
        setEditingPost(null);
        setIsCreateModalOpen(false);
    };

    const handleCreatePost = () => {
        resetCreateState();
        setIsCreateModalOpen(true);
    };

    const onSelectPhotoForPost = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setPostImage(reader.result as string);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSharePost = async () => {
        if (!currentUser) return;

        if (!postContent.trim() && !postImage) {
            toast({ variant: "destructive", title: "Boş Gönderi", description: "Lütfen bir şeyler yazın veya bir fotoğraf ekleyin." });
            return;
        }

        setIsPostProcessing(true);
        
        try {
            const hashtags = postContent.match(/#\w+/g)?.map(h => h.substring(1).toLowerCase()) || [];
            const mentions = postContent.match(/@\w+/g)?.map(m => m.substring(1)) || [];
            
            let postData: any = {
                authorId: currentUser.uid,
                createdAt: serverTimestamp(),
                likes: 0,
                commentsCount: 0,
                hashtags: hashtags,
                mentions: mentions,
                location: postLocation || '',
                type: postImage ? 'photo' : 'text',
                isAiEdited: false,
            };

            if (postImage) {
                const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}`);
                const uploadTask = await uploadString(storageRef, postImage, 'data_url');
                postData.url = await getDownloadURL(uploadTask.ref);
                postData.caption = postContent.trim();
                postData.textContent = postContent.trim();
            } else {
                postData.textContent = postContent.trim();
            }
            
            const postRef = await addDoc(collection(db, 'posts'), postData);
            const docSnap = await getDoc(postRef);
            if (!docSnap.exists()) throw new Error("Post creation failed in DB");
            const newPostFromDb = { id: docSnap.id, ...docSnap.data() };
            
            // Award XP for new post
            await awardXp({ userId: currentUser.uid, reason: 'NEW_POST' });

            const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const currentUserData = currentUserDoc.data() as User;

            const newPostForUI: Post = {
                ...newPostFromDb,
                user: currentUserData,
                comments: [],
                liked: false,
            } as Post;
            
            setPosts(prev => [newPostForUI, ...prev]);
            
            toast({ title: 'Paylaşıldı!', description: `Gönderiniz başarıyla paylaşıldı. (+${getXpForAction('NEW_POST')} XP)`, className: 'bg-green-500 text-white' });

        } catch (error) {
            console.error("Error sharing post: ", error);
            toast({ variant: 'destructive', title: 'Paylaşım Hatası', description: 'Gönderi paylaşılırken bir hata oluştu.' });
        } finally {
            resetCreateState();
        }
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
            <div key={post.id} className="w-full">
                <Card className="w-full rounded-none md:rounded-xl overflow-hidden shadow-none border-0 md:border-b">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between gap-3 p-3">
                            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                <Link href={`/profile/${post.user?.username}`}>
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={post.user?.avatarUrl} data-ai-hint={post.user?.aiHint} />
                                        <AvatarFallback>{post.user?.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex flex-col overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/profile/${post.user?.username}`} className="font-semibold text-sm truncate hover:underline">
                                            {post.user?.name.split(' ')[0]}
                                        </Link>
                                        <LevelBadge level={post.user?.level || 1} size="sm" />
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate">@{post.user?.username}</span>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="w-5 h-5"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {post.authorId === currentUser?.uid ? (
                                            <>
                                                <DropdownMenuItem>
                                                    <Pencil className="mr-2 h-4 w-4"/>
                                                    <span>Düzenle</span>
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4"/>
                                                            <span>Sil</span>
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Bu işlem geri alınamaz. Bu gönderiyi kalıcı olarak silecektir.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeletePost(post)} className={cn(buttonVariants({variant: "destructive"}))}>
                                                                Sil
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        ) : (
                                            <>
                                                <DropdownMenuItem>
                                                    <EyeOff className="mr-2 h-4 w-4"/>
                                                    <span>Gönderiyi Gizle</span>
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem>
                                                    <EyeOff className="mr-2 h-4 w-4"/>
                                                    <span>Bu Kullanıcıdan Gizle</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                    <UserX className="mr-2 h-4 w-4"/>
                                                    <span>Kullanıcıyı Engelle</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <Flag className="mr-2 h-4 w-4"/>
                                                    <span>Gönderiyi Şikayet Et</span>
                                                </DropdownMenuItem>
                                            </>
                                        )}
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
                                        <Link href={`/profile/${post.user?.username}`} className='mt-4'>
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
                                    <div className="whitespace-pre-wrap break-words"><HashtagAndMentionRenderer text={post.textContent || ''} /></div>
                                )}

                                {((post.lang && post.lang !== 'tr') || post.isTranslated) && (
                                    <button className="text-xs text-muted-foreground hover:underline mt-2 flex items-center gap-1">
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
                                <Button variant="ghost" size="icon" onClick={() => handleOpenComments(post)}>
                                    <MessageCircle className="w-6 h-6" />
                                </Button>
                            </div>
                            <Button variant="ghost" size="icon">
                                <Bookmark className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="px-3 pb-3 text-sm">
                             <span className="font-semibold cursor-pointer" onClick={() => handleOpenLikes(post.id)}>{post.likes.toLocaleString()} beğeni</span>
                            {post.type === 'photo' && post.caption && !post.isGalleryLocked && (
                                 <div className="whitespace-pre-wrap break-words">
                                    <Link href={`/profile/${post.user?.username}`} className="font-semibold mr-1">{post.user?.name.split(' ')[0]}</Link>
                                    <HashtagAndMentionRenderer text={post.caption} />
                                 </div>
                            )}
                            {post.commentsCount > 0 && (
                                <button className="text-muted-foreground mt-1 cursor-pointer" onClick={() => handleOpenComments(post)}>
                                {post.commentsCount.toLocaleString()} yorumun tümünü gör
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        ))) : (
             <div className="text-center text-muted-foreground py-20 flex flex-col items-center justify-center">
                <p className="text-lg">Henüz hiç gönderi yok.</p>
                <p className="text-sm">İlk gönderiyi paylaşan sen ol!</p>
            </div>
        )}
      </div>
      
       <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg" size="icon" onClick={handleCreatePost}>
            <Plus className="h-8 w-8" />
            <span className="sr-only">Yeni Gönderi Ekle</span>
       </Button>

       <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && resetCreateState()}>
            <DialogContent className="max-w-lg w-full h-full sm:h-auto sm:max-h-[95vh] p-0 flex flex-col data-[state=open]:h-screen sm:data-[state=open]:h-auto sm:rounded-lg">
                 <div className="flex items-center justify-between p-4 border-b shrink-0">
                    <Button variant="ghost" size="icon" onClick={resetCreateState}><XIcon/></Button>
                    <Button onClick={handleSharePost} disabled={isPostProcessing || (!postContent.trim() && !postImage)}>
                        {isPostProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : "Gönder" }
                    </Button>
                </div>
                
                <div className='flex-1 p-4 overflow-y-auto'>
                    <div className='flex items-start gap-3'>
                        <Avatar>
                            <AvatarImage src={currentUser?.photoURL || ''} />
                            <AvatarFallback>{currentUser?.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className='w-full'>
                            <p className="font-semibold">{currentUser?.displayName}</p>
                            <MentionTextarea 
                                placeholder="Ne düşünüyorsun?"
                                value={postContent}
                                setValue={setPostContent}
                                className="min-h-[120px] w-full border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
                            />
                             {postImage && (
                                <div className="mt-4 relative">
                                    <Image src={postImage} alt="Gönderi önizlemesi" width={500} height={500} className="rounded-xl w-full h-auto object-contain" />
                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => setPostImage(null)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                             )}
                        </div>
                    </div>
                </div>

                <div className='mt-auto p-2 border-t shrink-0'>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><Smile className="w-6 h-6"/></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><Mic className="w-6 h-6"/></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => createFileInputRef.current?.click()}><ImageIcon className="w-6 h-6"/></Button>
                            <input type="file" ref={createFileInputRef} onChange={onSelectPhotoForPost} accept="image/*" className="hidden" />
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><ListCollapse className="w-6 h-6"/></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><Music className="w-6 h-6"/></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><Hash className="w-6 h-6"/></Button>
                        </div>
                        <span className="text-sm text-muted-foreground">{postContent.length}/{postContentMaxLength}</span>
                    </div>
                     <div className="flex items-center justify-between w-full mt-1">
                        <Button variant="ghost" size="sm" className="text-muted-foreground h-auto p-1 px-2"><MapPin className="w-4 h-4 mr-2"/> Konum Ekle</Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground h-auto p-1 px-2">Herkese açık <ChevronRight className="w-4 h-4 ml-1"/></Button>
                     </div>
                </div>
            </DialogContent>
        </Dialog>


      <Sheet open={isCommentSheetOpen} onOpenChange={(open) => { if (!open) { setActivePostForComments(null); setCommentInput(''); } setCommentSheetOpen(open); }}>
            <SheetContent side="bottom" className="rounded-t-xl h-[80vh] flex flex-col p-0">
                <SheetHeader className="text-center p-4 border-b shrink-0">
                    <SheetTitle>Yorumlar</SheetTitle>
                    <SheetClose className="absolute left-4 top-1/2 -translate-y-1/2" />
                </SheetHeader>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-4 p-4">
                       {isCommentsLoading ? (
                           <div className='flex justify-center items-center h-full'><Loader2 className="w-6 h-6 animate-spin"/></div>
                       ) : activePostForComments && activePostForComments.comments.length > 0 ? (
                            activePostForComments.comments.map(comment => (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <Link href={`/profile/${comment.user?.username}`}>
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={comment.user?.avatarUrl} data-ai-hint={comment.user?.aiHint} />
                                            <AvatarFallback>{comment.user?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1 text-sm">
                                        <div className="flex items-baseline gap-2">
                                            <Link href={`/profile/${comment.user?.username}`} className="font-semibold">{comment.user?.name}</Link>
                                            <span className="text-xs text-muted-foreground font-mono">{comment.createdAt ? formatRelativeTime(comment.createdAt) : ''}</span>
                                        </div>
                                        
                                        <div className="mt-1"><HashtagAndMentionRenderer text={comment.text}/></div>
                                        <div className="flex gap-4 text-xs text-muted-foreground mt-2 items-center">
                                            <button className="cursor-pointer hover:underline" onClick={() => handleReply(comment.user!.username)}>Yanıtla</button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5">
                                        <Heart 
                                            className="w-4 h-4 cursor-pointer" 
                                            fill={comment.liked ? 'hsl(var(--destructive))' : 'transparent'} 
                                            stroke={comment.liked ? 'hsl(var(--destructive))' : 'currentColor'}
                                            onClick={() => handleCommentLikeClick(activePostForComments.id, comment.id)}
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
                        {['❤️', '👏', '😂', '🔥', '😢'].map(emoji => (
                            <span key={emoji} className="text-2xl cursor-pointer" onClick={() => handleAddEmoji(emoji)}>{emoji}</span>
                        ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handlePostComment(); }} className="flex items-center gap-2 mt-2">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={currentUser?.photoURL || "https://placehold.co/40x40.png"} data-ai-hint="current user portrait" />
                            <AvatarFallback>{currentUser?.displayName?.charAt(0) || 'B'}</AvatarFallback>
                        </Avatar>
                        <div className="relative flex-1">
                            <MentionTextarea 
                                isInput={true}
                                placeholder="Yorum ekle..." 
                                value={commentInput}
                                setValue={setCommentInput}
                                onEnterPress={handlePostComment}
                                disabled={isPostingComment}
                            />
                            <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full" disabled={isPostingComment || !commentInput.trim()}>
                                {isPostingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </form>
                </div>
            </SheetContent>
       </Sheet>

        <Dialog open={isLikesDialogVisible} onOpenChange={setIsLikesDialogVisible}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Beğenenler</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] -mx-6">
                   <div className='px-6'>
                    {isLikersLoading ? (
                        <div className="flex justify-center items-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
                    ) : likers.length > 0 ? (
                        <div className="space-y-4">
                            {likers.map(user => (
                                <Link key={user.uid} href={`/profile/${user.username}`} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted" onClick={() => setIsLikesDialogVisible(false)}>
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl} data-ai-hint={user.name} />
                                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-semibold">{user.name}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">Henüz kimse beğenmedi.</p>
                    )}
                   </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>

    </div>
  );
}
