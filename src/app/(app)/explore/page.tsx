
'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Bookmark, Plus, Send, Loader2, Languages, Lock, MoreHorizontal, EyeOff, UserX, Flag, Sparkles, Image as ImageIcon, Type, XIcon, Check, Wand2, Gem } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translateText } from '@/ai/flows/translate-text-flow';
import { stylizeImage } from '@/ai/flows/stylize-image-flow';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, getDocs, doc, getDoc, DocumentData, writeBatch, arrayUnion, updateDoc, increment, addDoc, serverTimestamp, where, documentId, arrayRemove, runTransaction, setDoc } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';

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

const HashtagRenderer = ({ text }: { text: string }) => {
    const parts = text.split(/(#\w+)/g);
    return (
        <p>
            {parts.map((part, i) =>
                part.startsWith('#') ? (
                    <Link key={i} href={`/tag/${part.substring(1)}`} className="text-blue-500 hover:underline">
                        {part}
                    </Link>
                ) : (
                    <React.Fragment key={i}>{part}</React.Fragment>
                )
            )}
        </p>
    );
};

type User = {
  uid: string;
  name: string;
  avatarUrl: string;
  aiHint?: string;
  isGalleryPrivate?: boolean;
  isPremium?: boolean;
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
    
    const [isCommentSheetOpen, setCommentSheetOpen] = useState(false);
    const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [isPostingComment, setIsPostingComment] = useState(false);

    const [isLikesDialogVisible, setIsLikesDialogVisible] = useState(false);
    const [likers, setLikers] = useState<User[]>([]);
    const [isLikersLoading, setIsLikersLoading] = useState(false);

    // Create Photo Post States
    const [isCreatePhotoModalOpen, setIsCreatePhotoModalOpen] = useState(false);
    const [imgSrc, setImgSrc] = useState('');
    const [originalImgSrc, setOriginalImgSrc] = useState('');
    const [stylePrompt, setStylePrompt] = useState('');
    const [caption, setCaption] = useState('');
    const [isStylized, setIsStylized] = useState(false);
    const [isPostProcessing, setIsPostProcessing] = useState(false);
    const [isPremium, setIsPremium] = useState(false);

    // Create Text Post States
    const [isCreateTextModalOpen, setIsCreateTextModalOpen] = useState(false);
    const [textContent, setTextContent] = useState('');

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
                        let userHasLiked = false;

                        if (post.authorId) {
                            const userDocRef = doc(db, 'users', post.authorId);
                            const userDocSnap = await getDoc(userDocRef);
                            if (userDocSnap.exists()) {
                                authorData = { ...userDocSnap.data(), uid: userDocSnap.id } as User;
                                
                                if (post.type === 'photo' && authorData.isGalleryPrivate && post.authorId !== currentUser?.uid) {
                                     if (currentUser) {
                                        const permissionDocRef = doc(db, 'users', post.authorId, 'galleryPermissions', currentUser.uid);
                                        const permissionDocSnap = await getDoc(permissionDocRef);
                                        if (!permissionDocSnap.exists()) {
                                            isGalleryLocked = true;
                                        }
                                    } else {
                                        isGalleryLocked = true; 
                                    }
                                }
                            }
                        }
                        
                         if (currentUser) {
                            const likeDocRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
                            const likeDocSnap = await getDoc(likeDocRef);
                            userHasLiked = likeDocSnap.exists();
                        }

                        return { ...post, user: authorData, comments: [], isGalleryLocked, liked: userHasLiked };
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
            // router.push('/login'); This can cause redirect loops
            setLoading(false);
        }
    }, [toast, currentUser]);

    useEffect(() => {
        const checkPremiumStatus = async () => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data().isPremium) {
                    setIsPremium(true);
                }
            }
        };
        checkPremiumStatus();
    }, [currentUser]);

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
                    }

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
                         authorDetails[doc.id] = { ...doc.data(), uid: doc.id } as User;
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
                user: { uid: currentUser.uid, name: currentUser.displayName || 'Siz', avatarUrl: currentUser.photoURL || '' },
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
            
            const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', likerIds));
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
    const handleReply = (username: string) => { setCommentInput(prev => `@${username} ${prev}`); commentInputRef.current?.focus(); };

    const handleTranslatePost = async (postId: string) => {
        // ... (existing implementation)
    };
    const handleTranslateComment = async (postId: string, commentId: string) => {
        // ... (existing implementation)
    };
    const hidePost = (postId: string) => {
        // ... (existing implementation)
    };
    const hideAllFromUser = (authorId: string) => {
        // ... (existing implementation)
    };
    const blockUser = async (authorId: string) => {
        // ... (existing implementation)
    };
    
    // --- Create Post Logic ---

    const resetCreatePhotoState = () => {
        setImgSrc('');
        setOriginalImgSrc('');
        setStylePrompt('');
        setCaption('');
        setIsStylized(false);
        setIsPostProcessing(false);
        setIsCreatePhotoModalOpen(false);
    };

    const resetCreateTextState = () => {
        setTextContent('');
        setIsPostProcessing(false);
        setIsCreateTextModalOpen(false);
    };

    const onSelectPhoto = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                if (reader.result) {
                    const dataUri = reader.result.toString();
                    setImgSrc(dataUri);
                    setOriginalImgSrc(dataUri);
                    setIsCreatePhotoModalOpen(true);
                }
            });
            reader.readAsDataURL(e.target.files[0]);
        }
        setIsCreateSheetOpen(false);
    };

    const handleCreateTextPost = () => {
        setIsCreateSheetOpen(false);
        setIsCreateTextModalOpen(true);
    };

    const handleApplyStyle = async () => {
        if (!stylePrompt) {
            toast({ variant: 'destructive', title: 'Stil Metni Gerekli', description: 'Lütfen bir stil metni girin.' });
            return;
        }
        setIsPostProcessing(true);
        try {
            const result = await stylizeImage({ photoDataUri: originalImgSrc, prompt: stylePrompt });
            if (result.error || !result.stylizedImageDataUri) {
                throw new Error(result.error || 'Stil uygulanamadı.');
            }
            setImgSrc(result.stylizedImageDataUri);
            setIsStylized(true);
            toast({ title: 'Stil Uygulandı!', description: 'Yapay zeka harikalar yarattı.', className: 'bg-green-500 text-white' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Stil Hatası', description: e.message });
        } finally {
            setIsPostProcessing(false);
        }
    };

    const handleSharePhoto = async () => {
        if (!currentUser || !imgSrc) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Gönderi paylaşmak için giriş yapmalısınız ve bir fotoğraf seçmelisiniz.' });
            return;
        }
        
        setIsPostProcessing(true);
        
        try {
            const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}`);
            const uploadTask = await uploadString(storageRef, imgSrc, 'data_url');
            const downloadURL = await getDownloadURL(uploadTask.ref);

            const hashtags = caption.match(/#\w+/g)?.map(h => h.substring(1).toLowerCase()) || [];

            const postData = { 
              authorId: currentUser.uid,
              createdAt: serverTimestamp(),
              likes: 0,
              commentsCount: 0,
              type: 'photo',
              url: downloadURL, 
              caption: caption || '',
              hashtags: hashtags,
              isAiEdited: isStylized,
            };

            const postRef = await addDoc(collection(db, 'posts'), postData);
            
            const docSnap = await getDoc(postRef);
            if (!docSnap.exists()) throw new Error("Post creation failed in DB");
            const newPostFromDb = { id: docSnap.id, ...docSnap.data() };


            // UI update with the real data from DB
            const newPostForUI: Post = {
                ...newPostFromDb,
                user: { uid: currentUser.uid, name: currentUser.displayName!, avatarUrl: currentUser.photoURL! },
                comments: [],
                liked: false,
            } as Post;
            
            setPosts(prev => [newPostForUI, ...prev]);
            
            toast({ title: 'Paylaşıldı!', description: 'Gönderiniz başarıyla paylaşıldı.', className: 'bg-green-500 text-white' });

        } catch (error) {
            console.error("Error sharing post: ", error);
            toast({ variant: 'destructive', title: 'Paylaşım Hatası', description: 'Gönderi paylaşılırken bir hata oluştu.' });
        } finally {
            resetCreatePhotoState();
        }
    };

    const handleShareTextPost = async () => {
        if (!currentUser || !textContent.trim()) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen bir metin girin.' });
            return;
        }
        
        setIsPostProcessing(true);
        
        try {
            const hashtags = textContent.match(/#\w+/g)?.map(h => h.substring(1).toLowerCase()) || [];

            const postData = { 
              authorId: currentUser.uid,
              createdAt: serverTimestamp(),
              likes: 0,
              commentsCount: 0,
              type: 'text',
              textContent: textContent,
              hashtags: hashtags,
              isAiEdited: false,
            };

            const postRef = await addDoc(collection(db, 'posts'), postData);
            const docSnap = await getDoc(postRef);
            if (!docSnap.exists()) throw new Error("Post creation failed in DB");
            const newPostFromDb = { id: docSnap.id, ...docSnap.data() };

            const newPostForUI: Post = {
                ...newPostFromDb,
                user: { uid: currentUser.uid, name: currentUser.displayName!, avatarUrl: currentUser.photoURL! },
                comments: [],
                liked: false,
            } as Post;
            
            setPosts(prev => [newPostForUI, ...prev]);
            
            toast({ title: 'Paylaşıldı!', description: 'Gönderiniz başarıyla paylaşıldı.', className: 'bg-green-500 text-white' });

        } catch (error) {
            console.error("Error sharing text post: ", error);
            toast({ variant: 'destructive', title: 'Paylaşım Hatası', description: 'Gönderi paylaşılırken bir hata oluştu.' });
        } finally {
            resetCreateTextState();
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
                            <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3 flex-1 overflow-hidden">
                                <Avatar className="w-8 h-8">
                                <AvatarImage src={post.user?.avatarUrl} data-ai-hint={post.user?.aiHint} />
                                <AvatarFallback>{post.user?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-semibold text-sm truncate">{post.user?.name}</span>
                                    {post.isAiEdited && (
                                        <Badge variant="outline" className="text-xs w-fit text-purple-500 border-purple-300">
                                            <Sparkles className="w-3 h-3 mr-1"/>
                                            BeAI ile düzenlendi
                                        </Badge>
                                    )}
                                </div>
                            </Link>
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
                                    <HashtagRenderer text={post.textContent || ''} />
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
                                 <div>
                                    <Link href={`/profile/${post.authorId}`} className="font-semibold mr-1">{post.user?.name}</Link>
                                    <HashtagRenderer text={post.caption} />
                                 </div>
                            )}
                            {post.commentsCount > 0 && (
                                <p className="text-muted-foreground mt-1 cursor-pointer" onClick={() => handleOpenComments(post)}>
                                {post.commentsCount.toLocaleString()} yorumun tümünü gör
                                </p>
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

        {/* Create Photo Modal */}
        <Dialog open={isCreatePhotoModalOpen} onOpenChange={resetCreatePhotoState}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Fotoğraf Paylaş</DialogTitle>
                    <DialogDescription>İsteğe bağlı olarak stil ve açıklama ekleyebilirsiniz.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    {imgSrc && ( <Image alt="Preview" src={imgSrc} width={500} height={500} className="max-h-[40vh] object-contain rounded-md" /> )}
                    <div className="w-full space-y-2">
                        <Textarea placeholder="Gönderin için bir şeyler yaz... #güzelbirgün" value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-[80px]" />
                    </div>
                    <div className="w-full space-y-2">
                        <Textarea placeholder="Yapay zeka stili ekle (Örn: bir Van Gogh tablosu gibi yap...)" value={stylePrompt} onChange={(e) => setStylePrompt(e.target.value)} disabled={isPostProcessing || !isPremium} className="min-h-[80px]" />
                        {isPremium ? (
                            <Button onClick={handleApplyStyle} disabled={isPostProcessing || !stylePrompt} className="w-full" variant="outline">
                                {isPostProcessing ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Wand2 className="mr-2 h-4 w-4" /> )}
                                Stil Uygula
                            </Button>
                        ) : (
                            <Link href="/premium" className="w-full">
                                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" variant="default">
                                    <Gem className="mr-2 h-4 w-4" />
                                    AI Düzenleme için Premium'a Yükselt
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={resetCreatePhotoState}>İptal</Button>
                    <Button onClick={handleSharePhoto} disabled={isPostProcessing}>
                        {isPostProcessing ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Check className="mr-2 h-4 w-4" /> )}
                        Paylaş
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Create Text Modal */}
        <Dialog open={isCreateTextModalOpen} onOpenChange={resetCreateTextState}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Metin Paylaş</DialogTitle>
                    <DialogDescription>Aklındakileri toplulukla paylaş.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder="Bugün harika bir gün... #mutluluk" 
                        value={textContent} 
                        onChange={(e) => setTextContent(e.target.value)} 
                        className="min-h-[150px]"
                        disabled={isPostProcessing}
                    />
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={resetCreateTextState}>İptal</Button>
                    <Button onClick={handleShareTextPost} disabled={isPostProcessing || !textContent.trim()}>
                        {isPostProcessing ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Check className="mr-2 h-4 w-4" /> )}
                        Paylaş
                    </Button>
                </DialogFooter>
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
                                    <Link href={`/profile/${comment.authorId}`}>
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={comment.user?.avatarUrl} data-ai-hint={comment.user?.aiHint} />
                                            <AvatarFallback>{comment.user?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1 text-sm">
                                        <div className="flex items-baseline gap-2">
                                            <Link href={`/profile/${comment.authorId}`} className="font-semibold">{comment.user?.name}</Link>
                                            <span className="text-xs text-muted-foreground font-mono">{comment.createdAt ? formatRelativeTime(comment.createdAt) : ''}</span>
                                        </div>
                                        
                                        <p className="mt-1">{comment.text}</p>
                                        <div className="flex gap-4 text-xs text-muted-foreground mt-2 items-center">
                                            <span className="cursor-pointer hover:underline" onClick={() => handleReply(comment.user!.name)}>Yanıtla</span>
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
                            <Input 
                                ref={commentInputRef}
                                placeholder="Yorum ekle..." 
                                className="bg-muted border-none rounded-full px-4 pr-10" 
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
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
                                <Link key={user.uid} href={`/profile/${user.uid}`} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted" onClick={() => setIsLikesDialogVisible(false)}>
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

    