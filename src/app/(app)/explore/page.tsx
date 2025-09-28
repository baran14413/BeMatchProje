
'use client';

import React, { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Heart, MessageCircle, Bookmark, Plus, Send, Loader2, Languages, Lock, MoreHorizontal, EyeOff, UserX, Flag, Sparkles, Image as ImageIcon, Type, X as XIcon, Check, Wand2, Gem, Trash2, Pencil, MapPin, ArrowLeft, Smile, Mic, ListCollapse, Music, Hash, Globe, ChevronRight, Paperclip, Crown, List as ListIcon, Users } from 'lucide-react';
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
import { translateText, TranslateTextOutput } from '@/ai/flows/translate-text-flow';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, getDocs, doc, getDoc, DocumentData, writeBatch, arrayUnion, updateDoc, increment, addDoc, serverTimestamp, where, documentId, arrayRemove, runTransaction, setDoc, deleteDoc, limit } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadString, deleteObject } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { MentionTextarea } from '@/components/ui/mention-textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';


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
  imageUrl?: string;
  originalText?: string;
  lang?: string;
  translatedText?: string;
  isTranslating: boolean;
  isTranslated: boolean;
  likes: number;
  liked: boolean;
  createdAt: any; // Can be Timestamp or Date
  parentId?: string | null;
  replies?: Comment[];
  isEdited?: boolean;
  // For flattened structure
  depth?: number; 
  replyCount?: number;
};


type Post = DocumentData & {
  id: string;
  type: 'photo' | 'text' | 'audio' | 'poll';
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
  comments: Comment[]; // This will now be a flat list
  isGalleryLocked?: boolean; 
  isAiEdited?: boolean;
  location?: string;
  audioUrl?: string;
  poll?: {
    question: string;
    options: { text: string, votes: number }[];
    voters?: { [key: string]: number }; // userId: optionIndex
    totalVotes: number;
    imageUrl?: string;
  }
};

type VoterInfo = {
    user: User;
    votedOptionText: string;
};

const PostSkeleton = () => (
    <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
        </CardContent>
        <Skeleton className="w-full aspect-square" />
        <CardFooter className="p-2 flex justify-around">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
        </CardFooter>
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
    const commentFileInputRef = useRef<HTMLInputElement>(null);
    const pollImageInputRef = useRef<HTMLInputElement>(null);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const [isCommentSheetOpen, setCommentSheetOpen] = useState(false);
    const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [commentImage, setCommentImage] = useState<string | null>(null);

    const [isLikesDialogVisible, setIsLikesDialogVisible] = useState(false);
    const [likers, setLikers] = useState<User[]>([]);
    const [isLikersLoading, setIsLikersLoading] = useState(false);
    const [showLikeAnimation, setShowLikeAnimation] = useState<string | null>(null);
    
    // Voters list states
    const [isVotersSheetOpen, setIsVotersSheetOpen] = useState(false);
    const [voters, setVoters] = useState<VoterInfo[]>([]);
    const [isVotersLoading, setIsVotersLoading] = useState(false);
    const [activePoll, setActivePoll] = useState<Post | null>(null);

    const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
    const commentMaxLength = 250;

    // Create/Edit Post States
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [postContent, setPostContent] = useState('');
    const [postImage, setPostImage] = useState<string | null>(null);
    const [postLocation, setPostLocation] = useState<string | null>(null);
    const [isPostProcessing, setIsPostProcessing] = useState(false);
    const postContentMaxLength = 1000;
    
    // New states for advanced post creation
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollImage, setPollImage] = useState<string | null>(null);
    const [postEmojis, setPostEmojis] = useState(false);
    const pollQuestionMaxLength = 150;
    
    


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
                        let isGalleryLocked = false;
                        const authorData = authorsData[post.authorId];

                        if (authorData && currentUser) {
                            if (post.type === 'photo' && authorData.isGalleryPrivate && post.authorId !== currentUser.uid) {
                                const permissionDocRef = doc(db, 'users', post.authorId, 'galleryPermissions', currentUser.uid);
                                const permissionDocSnap = await getDoc(permissionDocRef);
                                if (!permissionDocSnap.exists()) {
                                    isGalleryLocked = true;
                                }
                            }
                        }
                        
                        let liked = false;
                        if (currentUser) {
                           const likeDocRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
                           const likeDocSnap = await getDoc(likeDocRef);
                           liked = likeDocSnap.exists();
                        }


                        // Fetch recent likers
                        const recentLikersQuery = query(collection(db, 'posts', post.id, 'likes'), orderBy('likedAt', 'desc'), limit(3));
                        const recentLikersSnapshot = await getDocs(recentLikersQuery);
                        const recentLikerIds = recentLikersSnapshot.docs.map(d => d.id);
                        let recentLikersData: User[] = [];
                        if (recentLikerIds.length > 0) {
                           const likersQuery = query(collection(db, 'users'), where('uid', 'in', recentLikerIds));
                           const likersSnapshot = await getDocs(likersQuery);
                           recentLikersData = likersSnapshot.docs.map(d => ({ ...d.data(), uid: d.id } as User));
                        }


                        return { ...post, user: authorData, comments: [], isGalleryLocked, liked, recentLikers: recentLikersData };
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

        const postIndex = posts.findIndex((p) => p.id === postId);
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const newLikedState = !post.liked;
        const newLikesCount = newLikedState ? post.likes + 1 : post.likes - 1;

        if (newLikedState) {
            setShowLikeAnimation(postId);
            setTimeout(() => setShowLikeAnimation(null), 1000);
        }

        setPosts((prevPosts) => {
            const newPosts = [...prevPosts];
            newPosts[postIndex] = { ...post, liked: newLikedState, likes: newLikesCount };
            return newPosts;
        });

        try {
            await runTransaction(db, async (transaction) => {
                const postRef = doc(db, 'posts', postId);
                const likeRef = doc(postRef, 'likes', currentUser.uid);

                const postSnap = await transaction.get(postRef);
                if (!postSnap.exists()) {
                    throw new Error('Post does not exist!');
                }

                if (newLikedState) {
                    transaction.set(likeRef, { likedAt: serverTimestamp() });
                    transaction.update(postRef, { likes: increment(1) });
                } else {
                    transaction.delete(likeRef);
                    transaction.update(postRef, { likes: increment(-1) });
                }
            });

            if (newLikedState && post.authorId !== currentUser.uid) {
                const notificationRef = doc(collection(db, 'notifications'));
                 await setDoc(notificationRef, {
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
                    createdAt: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('Error updating like:', error);
            setPosts((prevPosts) => {
                const newPosts = [...prevPosts];
                newPosts[postIndex] = post;
                return newPosts;
            });
            toast({ variant: 'destructive', title: 'Beğenme işlemi başarısız oldu.' });
        }
    };
    
    // Function to flatten the comment tree
    const flattenComments = (comments: Comment[], parentId: string | null = null, depth = 0): Comment[] => {
        const flatList: Comment[] = [];
        
        comments
            .filter(c => c.parentId === parentId)
            .forEach(comment => {
                const replies = comments.filter(r => r.parentId === comment.id);
                flatList.push({ ...comment, depth, replyCount: replies.length });
                if (replies.length > 0) {
                    flatList.push(...flattenComments(comments, comment.id, depth + 1));
                }
            });
            
        return flatList;
    };


    const handleOpenComments = async (post: Post) => {
        if (!isCommentSheetOpen) {
            setActivePostForComments(post);
            setCommentSheetOpen(true);
            setIsCommentsLoading(true);
            try {
                const commentsQuery = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'desc'));
                const commentsSnapshot = await getDocs(commentsQuery);
                
                const authorIds = new Set(commentsSnapshot.docs.map(d => d.data().authorId));
                let authorDetails: Record<string, User> = {};

                if (authorIds.size > 0) {
                    const usersQuery = query(collection(db, 'users'), where('uid', 'in', Array.from(authorIds)));
                    const usersSnapshot = await getDocs(usersQuery);
                    usersSnapshot.forEach(doc => {
                         authorDetails[doc.data().uid] = { ...doc.data(), uid: doc.id } as User;
                    });
                }
                
                const commentsData = commentsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        user: authorDetails[data.authorId],
                        isTranslated: false,
                        isTranslating: false,
                    } as Comment
                });

                const flattenedComments = flattenComments(commentsData);

                setActivePostForComments(prevPost => prevPost ? { ...prevPost, comments: flattenedComments } : null);
                
            } catch (error) {
                 console.error("Error fetching comments:", error);
                 toast({ variant: 'destructive', title: "Yorumlar alınamadı." });
            } finally {
                setIsCommentsLoading(false);
            }
        }
    };

    const handlePostComment = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !activePostForComments || (!commentInput.trim() && !commentImage)) return;

        setIsPostingComment(true);

        try {
            const newCommentData: any = {
                authorId: currentUser.uid,
                likes: 0,
                createdAt: serverTimestamp(),
                parentId: replyingTo?.id || null,
                isEdited: false,
            };

            if (commentImage) {
                const storageRef = ref(storage, `comment_images/${activePostForComments.id}/${Date.now()}`);
                const uploadTask = await uploadString(storageRef, commentImage, 'data_url');
                newCommentData.imageUrl = await getDownloadURL(uploadTask.ref);
            }
            if (commentInput.trim()) {
                newCommentData.text = commentInput.trim();
            }

            const postRef = doc(db, 'posts', activePostForComments.id);
            const commentsRef = collection(postRef, 'comments');
            
            const newCommentRef = await addDoc(commentsRef, newCommentData);
            await updateDoc(postRef, { commentsCount: increment(1) });
            
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
                    postId: activePostForComments.id,
                    content: newCommentData.text ? newCommentData.text.substring(0, 50) : '[Resim]',
                    read: false,
                    createdAt: serverTimestamp(),
                });
            }

            const newCommentForUI: Comment = {
                ...newCommentData,
                id: newCommentRef.id,
                user: { uid: currentUser.uid, name: currentUser.displayName || 'Siz', avatarUrl: currentUser.photoURL || '', username: currentUser.email?.split('@')[0] || 'user' },
                createdAt: new Date(),
                liked: false,
                replies: [],
                depth: replyingTo ? (activePostForComments.comments.find(c => c.id === replyingTo.id)?.depth || 0) + 1 : 0,
                replyCount: 0,
            };

             setActivePostForComments((prev) => {
                if (!prev) return null;
                const newComments = [...prev.comments];
                if (replyingTo) {
                    const parentIndex = newComments.findIndex(c => c.id === replyingTo.id);
                    if (parentIndex !== -1) {
                         // Insert reply right after the parent
                        newComments.splice(parentIndex + 1, 0, newCommentForUI);
                         // Update reply count on parent
                        newComments[parentIndex].replyCount = (newComments[parentIndex].replyCount || 0) + 1;
                    } else {
                        // Fallback if parent not found, add to top level
                         newComments.unshift(newCommentForUI);
                    }
                } else {
                    newComments.unshift(newCommentForUI);
                }
                return { ...prev, comments: newComments, commentsCount: prev.commentsCount + 1 };
            });

             setPosts((prevPosts) =>
                prevPosts.map((p) =>
                    p.id === activePostForComments.id
                        ? { ...p, commentsCount: p.commentsCount + 1 }
                        : p
                )
            );

            setCommentInput('');
            setCommentImage(null);
            setReplyingTo(null);

        } catch (error) {
            console.error('Error posting comment:', error);
            toast({ variant: 'destructive', title: 'Yorum gönderilemedi.' });
        } finally {
            setIsPostingComment(false);
        }
    }, [currentUser, activePostForComments, commentInput, commentImage, replyingTo, toast]);
    
    const onSelectCommentImage = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                if (reader.result) {
                    setCommentImage(reader.result.toString());
                }
            });
            reader.readAsDataURL(e.target.files[0]);
        }
        if (commentFileInputRef.current) {
            commentFileInputRef.current.value = '';
        }
    };

    const handleOpenLikes = async (postId: string) => {
        setIsLikesDialogVisible(true);
        setIsLikersLoading(true);
        setLikers([]);
        try {
            const likesQuery = query(collection(db, 'posts', postId, 'likes'), orderBy('likedAt', 'desc'));
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
    
    const handleOpenVoters = async (post: Post) => {
        if (!post.poll?.voters) return;
        
        setIsVotersSheetOpen(true);
        setIsVotersLoading(true);
        setActivePoll(post);
        setVoters([]);

        try {
            const voterIds = Object.keys(post.poll.voters);
            if (voterIds.length === 0) {
                setIsVotersLoading(false);
                return;
            }
            
            const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', voterIds));
            const usersSnapshot = await getDocs(usersQuery);
            const usersData: Record<string, User> = {};
            usersSnapshot.forEach(doc => {
                usersData[doc.id] = { uid: doc.id, ...doc.data() } as User;
            });
            
            const votersInfo = voterIds.map(uid => {
                const optionIndex = post.poll!.voters![uid];
                return {
                    user: usersData[uid],
                    votedOptionText: post.poll!.options[optionIndex].text,
                };
            }).filter(v => v.user); // Filter out any cases where user data might be missing

            setVoters(votersInfo);

        } catch (error) {
            console.error("Error fetching voters:", error);
            toast({ variant: "destructive", title: "Oy verenler listesi alınamadı." });
        } finally {
            setIsVotersLoading(false);
        }
    };


    const handleAddEmoji = (emoji: string) => {
        if (commentInput.length + emoji.length <= commentMaxLength) {
            setCommentInput(prevInput => prevInput + emoji);
        }
    };
    
    const handleReply = useCallback((comment: Comment) => {
        if (!comment.user?.username) return;
        const mention = `@${comment.user.username} `;
        setReplyingTo({ id: comment.id, username: comment.user.username });
        setCommentInput((prev) => {
            if (prev.startsWith(mention)) return prev;
            return mention + prev;
        });
      }, []);
    
    const handleDeletePost = async (post: Post) => {
        if (!currentUser || post.authorId !== currentUser.uid) return;
        
        try {
            await deleteDoc(doc(db, "posts", post.id));

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

    const resetCreateState = () => {
        setPostContent('');
        setPostImage(null);
        setPostLocation(null);
        setIsPostProcessing(false);
        setEditingPost(null);
        setIsCreateModalOpen(false);
        setShowPollCreator(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollImage(null);
        setPostEmojis(false);
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

    const onSelectPollImage = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setPollImage(reader.result as string);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleAddLocation = () => {
        if (postLocation) {
            setPostLocation(null);
            return;
        }
        
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                // In a real app, you'd use a reverse geocoding API. Here we mock it.
                // This is a placeholder. You'd need to replace this with a real API call.
                const mockLocation = "Ankara, Türkiye";
                setPostLocation(mockLocation);
                 toast({ title: "Konum Eklendi", description: mockLocation });
            }, (error) => {
                toast({ variant: "destructive", title: "Konum Alınamadı", description: "Lütfen tarayıcı izinlerinizi kontrol edin."});
                console.error("Geolocation error:", error);
            });
        } else {
             toast({ variant: "destructive", title: "Desteklenmiyor", description: "Tarayıcınız konum servisini desteklemiyor." });
        }
    };

    const handleSharePost = async () => {
        if (!currentUser) return;

        let contentToCheck = postContent.trim();
        if (showPollCreator) {
            contentToCheck = pollQuestion.trim();
        }

        if (!contentToCheck && !postImage && !showPollCreator) {
            toast({ variant: "destructive", title: "Boş Gönderi", description: "Lütfen bir şeyler yazın veya bir içerik ekleyin." });
            return;
        }

        if (showPollCreator && !pollQuestion.trim()) {
            toast({ variant: "destructive", title: "Eksik Anket Bilgisi", description: "Lütfen anket sorusunu doldurun." });
            return;
        }
        
        if (showPollCreator && pollOptions.filter(o => o.trim()).length < 2) {
             toast({ variant: "destructive", title: "Eksik Seçenek", description: "Anketler en az iki geçerli seçeneğe sahip olmalıdır." });
            return;
        }

        setIsPostProcessing(true);
        
        try {
            const textContentForParsing = showPollCreator ? pollQuestion.trim() : postContent.trim();
            const hashtags = textContentForParsing.match(/#\w+/g)?.map(h => h.substring(1).toLowerCase()) || [];
            const mentions = textContentForParsing.match(/@\w+/g)?.map(m => m.substring(1)) || [];
            
            let postData: any = {
                authorId: currentUser.uid,
                createdAt: serverTimestamp(),
                likes: 0,
                commentsCount: 0,
                hashtags: hashtags,
                mentions: mentions,
                isAiEdited: false,
            };

            if (postLocation) {
                postData.location = postLocation;
            }

            if (showPollCreator) {
                postData.type = 'poll';
                postData.poll = {
                    question: pollQuestion.trim(),
                    options: pollOptions.filter(o => o.trim()).map(o => ({ text: o, votes: 0 })),
                    voters: {},
                    totalVotes: 0,
                    imageUrl: ''
                };
                if (pollImage) {
                    const storageRef = ref(storage, `poll_images/${currentUser.uid}/${Date.now()}`);
                    const uploadTask = await uploadString(storageRef, pollImage, 'data_url');
                    postData.poll.imageUrl = await getDownloadURL(uploadTask.ref);
                }
            } else if (postImage) {
                postData.type = 'photo';
                const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}`);
                const uploadTask = await uploadString(storageRef, postImage, 'data_url');
                postData.url = await getDownloadURL(uploadTask.ref);
                postData.caption = postContent.trim();
            } else {
                postData.type = 'text';
                postData.textContent = postContent.trim();
            }
            
            const postRef = await addDoc(collection(db, 'posts'), postData);
            const docSnap = await getDoc(postRef);
            if (!docSnap.exists()) throw new Error("Post creation failed in DB");
            const newPostFromDb = { id: docSnap.id, ...docSnap.data() };
            
            const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const currentUserData = currentUserDoc.data() as User;

            const newPostForUI: Post = {
                ...newPostFromDb,
                user: currentUserData,
                comments: [],
                liked: false,
                recentLikers: [],
            } as Post;
            
            setPosts(prev => [newPostForUI, ...prev]);
            
            toast({ title: 'Paylaşıldı!', description: `Gönderiniz başarıyla paylaşıldı.`, className: 'bg-green-500 text-white' });

        } catch (error) {
            console.error("Error sharing post: ", error);
            toast({ variant: 'destructive', title: 'Paylaşım Hatası', description: 'Gönderi paylaşılırken bir hata oluştu.' });
        } finally {
            resetCreateState();
        }
    };
    
    const handleTranslate = useCallback(async (textToTranslate: string, updateFn: (result: TranslateTextOutput & { isTranslated: boolean }) => void) => {
        updateFn({ isTranslating: true, isTranslated: false });
        try {
            const result = await translateText({ textToTranslate });
            if (result.error) {
                throw new Error(result.error);
            }
            updateFn({ ...result, isTranslating: false, isTranslated: true });
        } catch (error: any) {
            console.error("Translation error:", error);
            toast({ variant: "destructive", title: "Çeviri Hatası", description: error.message });
            updateFn({ isTranslating: false, isTranslated: false });
        }
    }, [toast]);
    
    const updatePostTranslation = useCallback((postId: string, data: Partial<Post>) => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...data } : p));
    }, []);

    const updateCommentTranslationState = useCallback((commentId: string, data: Partial<Comment>) => {
         setActivePostForComments(prevPost => {
            if (!prevPost) return null;

            const updateCommentState = (comments: Comment[]): Comment[] => {
                return comments.map(c => {
                    if (c.id === commentId) {
                        return { ...c, ...data };
                    }
                    if (c.replies) {
                        return { ...c, replies: updateCommentState(c.replies) };
                    }
                    return c;
                });
            };

            return { ...prevPost, comments: updateCommentState(prevPost.comments) };
        });
    }, []);

    const togglePostTranslation = useCallback((post: Post) => {
        if (post.isTranslated) {
            // Switch back to original
            updatePostTranslation(post.id, { isTranslated: false, textContent: post.originalTextContent });
        } else {
            // Translate if not already translated
            if (post.translatedText) {
                 updatePostTranslation(post.id, { isTranslated: true, textContent: post.translatedText });
            } else {
                 handleTranslate(post.textContent!, (result) => {
                    updatePostTranslation(post.id, { 
                        ...result, 
                        isTranslated: true, 
                        originalTextContent: post.textContent, 
                        textContent: result.translatedText || post.textContent 
                    });
                });
            }
        }
    }, [handleTranslate, updatePostTranslation]);
    
    const toggleCommentTranslation = useCallback((comment: Comment) => {
        if (comment.isTranslated) {
             updateCommentTranslationState(comment.id, { isTranslated: false, text: comment.originalText });
        } else {
             if (comment.translatedText) {
                updateCommentTranslationState(comment.id, { isTranslated: true, text: comment.translatedText });
             } else {
                 handleTranslate(comment.text!, (result) => {
                    updateCommentTranslationState(comment.id, { 
                        ...result, 
                        isTranslated: true,
                        originalText: comment.text,
                        text: result.translatedText || comment.text,
                    });
                });
             }
        }
    }, [handleTranslate, updateCommentTranslationState]);
    
     const handleVote = async (post: Post, optionIndex: number) => {
        if (!currentUser || !post.poll) return;

        const postRef = doc(db, "posts", post.id);

        try {
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) {
                    throw "Gönderi bulunamadı!";
                }

                const currentPost = postDoc.data() as Post;
                const poll = currentPost.poll;
                if (!poll) return;
                
                const voters = poll.voters || {};
                const userVote = voters[currentUser.uid];
                
                if (userVote !== undefined) {
                   return; // User has already voted
                }

                // Apply the new vote
                voters[currentUser.uid] = optionIndex;
                poll.options[optionIndex].votes += 1;
                poll.totalVotes = (poll.totalVotes || 0) + 1;
                
                transaction.update(postRef, { poll });
            });
            
             // Optimistically update UI
            const updatedPosts = posts.map(p => {
                if (p.id === post.id && p.poll) {
                    const newPoll = { ...p.poll };
                    newPoll.options[optionIndex].votes += 1;
                    newPoll.totalVotes = (newPoll.totalVotes || 0) + 1;
                    newPoll.voters = { ...newPoll.voters, [currentUser.uid]: optionIndex };
                    return { ...p, poll: newPoll };
                }
                return p;
            });
            setPosts(updatedPosts);

        } catch (error) {
            console.error("Error voting on poll: ", error);
            toast({ variant: "destructive", title: "Oy kullanılamadı." });
        }
    };


    const CommentComponent = useCallback(({ comment }: { comment: Comment }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editText, setEditText] = useState(comment.text);
        const [repliesVisible, setRepliesVisible] = useState(false);
        const currentUser = auth.currentUser;

    const handleCommentLikeClick = (commentId: string) => {
        // This is an optimistic update. In a real app, you'd also update Firestore.
    };

    const handleDeleteComment = async () => {
        if (!currentUser || !activePostForComments) return;
        
        try {
            const commentRef = doc(db, 'posts', activePostForComments.id, 'comments', comment.id);
            await deleteDoc(commentRef);

            const postRef = doc(db, 'posts', activePostForComments.id);
            await updateDoc(postRef, { commentsCount: increment(-1) });

             setActivePostForComments(prev => {
                if (!prev) return null;
                const removeComment = (comments: Comment[], idToRemove: string): Comment[] => {
                    return comments.filter(c => c.id !== idToRemove).map(c => {
                        if (c.replies) {
                           return {...c, replies: removeComment(c.replies, idToRemove)}
                        }
                        return c;
                    })
                }
                const newComments = removeComment(prev.comments, comment.id);
                return {...prev, comments: newComments, commentsCount: prev.commentsCount - 1}
            });
            setPosts(prev => prev.map(p => p.id === activePostForComments.id ? {...p, commentsCount: p.commentsCount - 1} : p));

            toast({ title: "Yorum silindi." });
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast({ variant: 'destructive', title: "Yorum silinemedi." });
        }
    };
    
    const handleUpdateComment = async () => {
        if (!currentUser || !activePostForComments || !editText.trim()) return;

        try {
            const commentRef = doc(db, 'posts', activePostForComments.id, 'comments', comment.id);
            await updateDoc(commentRef, {
                text: editText,
                isEdited: true
            });

            setActivePostForComments(prev => {
                if (!prev) return null;
                const updateComment = (comments: Comment[]): Comment[] => {
                    return comments.map(c => {
                        if (c.id === comment.id) {
                            return {...c, text: editText, isEdited: true};
                        }
                        if (c.replies) {
                            return {...c, replies: updateComment(c.replies)};
                        }
                        return c;
                    })
                }
                return {...prev, comments: updateComment(prev.comments)}
            });

            setIsEditing(false);
            toast({ title: "Yorum güncellendi." });
        } catch (error) {
            console.error("Error updating comment:", error);
            toast({ variant: 'destructive', title: "Yorum güncellenemedi." });
        }
    };


    return (
        <div style={{ paddingLeft: `${(comment.depth || 0) * 20}px` }} className="flex flex-col">
            <div className="flex items-start gap-3">
                <Link href={`/profile/${comment.user?.username}`}>
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.user?.avatarUrl} data-ai-hint={comment.user?.aiHint} />
                        <AvatarFallback>{comment.user?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 text-sm">
                    <div className="flex items-baseline gap-2">
                        <Link href={`/profile/${comment.user?.username}`} className="font-semibold flex items-center gap-1.5">
                            {comment.user?.name}
                            {comment.user?.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                        </Link>
                        <span className="text-xs text-muted-foreground font-mono">{comment.createdAt ? formatRelativeTime(comment.createdAt) : ''}</span>
                        {comment.isEdited && <span className="text-xs text-muted-foreground">(düzenlendi)</span>}
                    </div>
                    
                     {isEditing ? (
                        <div className="mt-2 space-y-2">
                            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[60px]" />
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>İptal</Button>
                                <Button size="sm" onClick={handleUpdateComment}>Kaydet</Button>
                            </div>
                        </div>
                     ) : (
                        <>
                            {comment.imageUrl && <Image src={comment.imageUrl} alt="Yorum resmi" width={150} height={150} className="mt-2 rounded-lg object-cover" />}
                            {comment.text && <div className="mt-1"><HashtagAndMentionRenderer text={comment.text}/></div>}
                        </>
                     )}

                    <div className="flex gap-4 text-xs text-muted-foreground mt-2 items-center">
                        <button className="cursor-pointer hover:underline" onClick={() => handleReply(comment)}>Yanıtla</button>
                        {comment.isTranslating ? (
                             <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Çevriliyor...</span>
                        ) : (comment.lang && comment.lang !== 'tr') && (
                            <button className="cursor-pointer hover:underline" onClick={() => toggleCommentTranslation(comment)}>
                                {comment.isTranslated ? 'Aslına bak' : 'Çevirisine bak'}
                            </button>
                        )}
                        {currentUser?.uid === comment.authorId && !isEditing && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                     <button className="cursor-pointer hover:underline">
                                        <MoreHorizontal className="w-4 h-4" />
                                     </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
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
                                                <AlertDialogTitle>Yorumu Sil</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteComment} className={cn(buttonVariants({variant: "destructive"}))}>
                                                    Evet, Sil
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <Heart 
                        className="w-4 h-4 cursor-pointer" 
                        fill={comment.liked ? 'hsl(var(--primary))' : 'transparent'} 
                        stroke={comment.liked ? 'hsl(var(--primary))' : 'currentColor'}
                        onClick={() => handleCommentLikeClick(comment.id)}
                    />
                    <span className="text-xs text-muted-foreground">{comment.likes > 0 ? comment.likes : ''}</span>
                </div>
            </div>

            {comment.replyCount && comment.replyCount > 0 ? (
                <button onClick={() => setRepliesVisible(!repliesVisible)} className="text-xs font-semibold text-muted-foreground hover:underline flex items-center gap-2 mt-2 ml-12">
                    <div className='w-8 h-px bg-border'/>
                    {repliesVisible ? 'Yanıtları gizle' : `Diğer ${comment.replyCount} yanıtı gör`}
                </button>
            ) : null}
            
            {repliesVisible && activePostForComments && activePostForComments.comments
                .filter(reply => reply.parentId === comment.id)
                .map(reply => <CommentComponent key={reply.id} comment={reply} />)
            }
        </div>
    );
  }, [activePostForComments, handleReply, toast, toggleCommentTranslation, currentUser?.uid]);


  return (
    <div className="w-full pb-20 md:pb-0">
        <div className="container mx-auto max-w-lg space-y-6 pt-4">
            {loading ? (
                <>
                    <PostSkeleton />
                    <PostSkeleton />
                </>
            ) : posts.length > 0 ? (
                posts.map((post) => (
                   <Card key={post.id} className="w-full mx-auto">
                        <AnimatePresence>
                        {showLikeAnimation === post.id && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.2, opacity: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                            >
                                <Heart className="w-24 h-24 text-red-500 drop-shadow-lg animate-pulse-heart" fill="currentColor" />
                            </motion.div>
                        )}
                        </AnimatePresence>

                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Link href={`/profile/${post.user?.username}`} className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border-2">
                                        <AvatarImage src={post.user?.avatarUrl} data-ai-hint={post.user?.aiHint} />
                                        <AvatarFallback>{post.user?.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-sm flex items-center gap-2">
                                            {post.user?.name}
                                            {post.user?.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt?.toDate())}</p>
                                    </div>
                                </Link>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {post.authorId === currentUser?.uid && (
                                            <>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4"/>
                                                            <span>Gönderiyi Sil</span>
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                     <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Gönderiyi Sil</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Bu gönderiyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeletePost(post)} className={cn(buttonVariants({variant: "destructive"}))}>
                                                                Evet, Sil
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        <DropdownMenuItem><Flag className="mr-2 h-4 w-4"/> Şikayet Et</DropdownMenuItem>
                                        <DropdownMenuItem><EyeOff className="mr-2 h-4 w-4"/> Bu Gönderiyi Gizle</DropdownMenuItem>
                                        <DropdownMenuItem><UserX className="mr-2 h-4 w-4"/> {post.user?.name} Adlı Kullanıcıyı Engelle</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        
                        <CardContent>
                             {post.isGalleryLocked ? (
                                <div className="relative aspect-video flex flex-col items-center justify-center text-center p-6 bg-muted rounded-lg overflow-hidden">
                                     <Image
                                        src={post.url!}
                                        alt={`Post by ${post.user?.name}`}
                                        fill
                                        className="object-cover blur-lg scale-110"
                                        data-ai-hint={post.aiHint}
                                    />
                                    <div className="absolute inset-0 bg-black/30"></div>
                                    <div className="relative z-10 flex flex-col items-center text-white">
                                        <Lock className="w-10 h-10 mb-2"/>
                                        <p className="font-semibold">Bu gönderi gizli</p>
                                        <p className="text-xs max-w-xs">{post.user?.name}'in gönderilerini görmek için takip etmelisiniz.</p>
                                         <Link href={`/profile/${post.user?.username}`} className="mt-4">
                                            <Button variant="secondary" size="sm">Profile Git</Button>
                                        </Link>
                                    </div>
                                </div>
                             ) : post.type === 'photo' && post.url ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden" onDoubleClick={() => handleLikeClick(post.id)}>
                                    <Image
                                        src={post.url}
                                        alt={`Post by ${post.user?.name}`}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={post.aiHint}
                                    />
                                </div>
                            ) : post.type === 'text' && post.textContent ? (
                                <div>
                                     <p className="text-base whitespace-pre-wrap break-words mb-2"><HashtagAndMentionRenderer text={post.textContent}/></p>
                                     {(post.lang && post.lang !== 'tr') && (
                                        <Button variant="ghost" size="sm" onClick={() => togglePostTranslation(post)} disabled={post.isTranslating}>
                                            {post.isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Languages className="mr-2 h-4 w-4"/>}
                                            {post.isTranslating ? "Çevriliyor..." : post.isTranslated ? 'Orijinalini Gör' : 'Çeviriyi Gör'}
                                        </Button>
                                     )}
                                </div>
                            ) : post.poll ? (
                                <div className="space-y-3">
                                    <div className='relative'>
                                         {post.poll.imageUrl && (
                                            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-2">
                                                <Image src={post.poll.imageUrl} alt="Anket görseli" layout="fill" className="object-cover" />
                                                <div className="absolute inset-0 bg-black/40"></div>
                                            </div>
                                         )}
                                        <h4 className={cn("font-semibold text-lg text-center", post.poll.imageUrl && "absolute bottom-4 left-4 text-white")}>{post.poll.question}</h4>
                                    </div>

                                    <div className="space-y-2">
                                        {post.poll.options.map((option, index) => {
                                            const hasVoted = post.poll?.voters && currentUser && post.poll.voters[currentUser.uid] !== undefined;
                                            const isMyVote = hasVoted && post.poll?.voters![currentUser.uid] === index;
                                            const percentage = post.poll.totalVotes > 0 ? (option.votes / post.poll.totalVotes) * 100 : 0;

                                            return (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    className="w-full h-auto justify-start p-0 overflow-hidden relative"
                                                    onClick={() => handleVote(post, index)}
                                                    disabled={hasVoted}
                                                >
                                                    <div
                                                        className={cn("absolute left-0 top-0 h-full bg-primary/20", isMyVote ? "bg-primary/40" : "")}
                                                        style={{ width: hasVoted ? `${percentage}%` : '0%' }}
                                                    />
                                                    <div className="relative z-10 flex items-center justify-between w-full p-3">
                                                         <div className='flex items-center'>
                                                            {isMyVote && <Check className="w-4 h-4 mr-2 text-primary" />}
                                                            <span className="font-medium">{option.text}</span>
                                                        </div>
                                                        {hasVoted && <span className="text-sm font-semibold">{Math.round(percentage)}%</span>}
                                                    </div>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex justify-between">
                                        <button onClick={() => handleOpenVoters(post)} className="hover:underline">{post.poll.totalVotes} oy</button>
                                        <span>Anket sona erdi.</span>
                                    </div>
                                </div>
                            ): null}
                        </CardContent>
                         {!post.isGalleryLocked && (
                            <CardFooter className="flex-col items-start gap-3 p-4">
                                <div className="flex w-full justify-between items-center">
                                    <div className='flex items-center'>
                                        <Button 
                                            variant="ghost" 
                                            className="h-10 px-3 flex items-center gap-2 rounded-full"
                                            onClick={() => handleLikeClick(post.id)}
                                        >
                                            <Heart className={cn("w-6 h-6", post.liked && "text-red-500 fill-red-500")} />
                                            <span className={cn("font-semibold", post.liked && "text-red-500")}>Beğen</span>
                                        </Button>
                                        <Button variant="ghost" className="h-10 px-3 flex items-center gap-2 rounded-full" onClick={() => handleOpenComments(post)}>
                                            <MessageCircle className="w-6 h-6" />
                                            <span className="font-semibold">Yorum</span>
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <Bookmark className="w-6 h-6"/>
                                    </Button>
                                </div>
                                
                                {post.likes > 0 && (
                                     <button onClick={() => handleOpenLikes(post.id)} className="flex items-center -space-x-2">
                                        {post.recentLikers.slice(0, 3).map(liker => (
                                             <Avatar key={liker.uid} className="w-5 h-5 border-2 border-background">
                                                <AvatarImage src={liker.avatarUrl} data-ai-hint={liker.name}/>
                                                <AvatarFallback>{liker.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        ))}
                                         <span className="pl-3 text-xs text-muted-foreground">
                                             {post.recentLikers[0]?.name.split(' ')[0]} ve {post.likes - 1} diğer kişi beğendi
                                        </span>
                                    </button>
                                )}

                                {post.caption && (
                                    <div className="text-sm whitespace-pre-wrap break-words pt-1">
                                        <Link href={`/profile/${post.user?.username}`} className="font-bold mr-1">{post.user?.name.split(' ')[0]}</Link>
                                        <HashtagAndMentionRenderer text={post.caption}/>
                                    </div>
                                )}
                                
                                {post.commentsCount > 0 && (
                                    <button onClick={() => handleOpenComments(post)} className="text-sm text-muted-foreground font-semibold">
                                        {post.commentsCount} yorumun tümünü gör
                                    </button>
                                )}

                            </CardFooter>
                         )}
                    </Card>
                ))
            ) : (
                !loading && (
                    <div className="text-center text-muted-foreground py-20 col-span-full">
                        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50"/>
                        <p className="text-lg font-semibold">Henüz hiç gönderi yok.</p>
                        <p className="text-sm">Takip ettiğiniz kişiler veya sizin için önerilenler burada görünecek.</p>
                         <Button className="mt-4" onClick={handleCreatePost}>
                            <Plus className="mr-2 h-4 w-4" /> İlk Gönderiyi Paylaş
                        </Button>
                    </div>
                )
            )
        )}
        </div>
      
       <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:hidden" size="icon" onClick={handleCreatePost}>
            <Plus className="h-8 w-8" />
            <span className="sr-only">Yeni Gönderi Ekle</span>
       </Button>

        <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && resetCreateState()}>
            <DialogContent className="max-w-lg w-full h-full sm:h-auto sm:max-h-[95vh] p-0 flex flex-col data-[state=open]:h-screen sm:data-[state=open]:h-auto sm:rounded-lg">
                <DialogHeader className="p-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                         <Button variant="ghost" size="icon" onClick={resetCreateState}><XIcon/></Button>
                         <DialogTitle className='sr-only'>
                            Yeni Gönderi Oluştur
                        </DialogTitle>
                         <Button onClick={handleSharePost} disabled={isPostProcessing}>
                            {isPostProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : "Gönder" }
                        </Button>
                    </div>
                </DialogHeader>
                
                <div className='flex-1 p-4 overflow-y-auto'>
                     <div className='flex items-start gap-3'>
                        <Avatar>
                            <AvatarImage src={currentUser?.photoURL || ''} />
                            <AvatarFallback>{currentUser?.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className='w-full'>
                            <p className="font-semibold">{currentUser?.displayName}</p>
                            
                             {showPollCreator ? (
                                <div className="mt-2 space-y-4 w-full text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        {pollImage && (
                                            <div className="mt-2 relative w-full rounded-xl overflow-hidden aspect-video">
                                                <Image src={pollImage} alt="Anket önizlemesi" layout="fill" className="object-contain" />
                                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={() => setPollImage(null)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                         <div className='space-y-2 w-full mt-4'>
                                            <Label htmlFor='poll-question' className="sr-only">Anket Sorusu</Label>
                                            <Textarea
                                                id="poll-question"
                                                placeholder="Anket sorunuzu yazın..."
                                                value={pollQuestion}
                                                maxLength={pollQuestionMaxLength}
                                                onChange={(e) => setPollQuestion(e.target.value)}
                                                className="w-full text-lg font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center resize-none"
                                            />
                                            <p className='text-xs text-muted-foreground text-right'>{pollQuestion.length}/{pollQuestionMaxLength}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {pollOptions.map((opt, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    placeholder={`Seçenek ${index + 1}`}
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...pollOptions];
                                                        newOpts[index] = e.target.value;
                                                        setPollOptions(newOpts);
                                                    }}
                                                />
                                                {pollOptions.length > 2 && <Button variant="ghost" size="icon" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}><XIcon className="w-4 h-4 text-destructive" /></Button>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {pollOptions.length < 4 && <Button variant="outline" size="sm" onClick={() => setPollOptions([...pollOptions, ''])}>Seçenek Ekle</Button>}
                                         <Button variant="outline" size="sm" onClick={() => pollImageInputRef.current?.click()}>
                                            <ImageIcon className="mr-2 h-4 w-4"/>
                                            Resim Ekle
                                        </Button>
                                        <input type="file" ref={pollImageInputRef} onChange={onSelectPollImage} accept="image/*" className="hidden" />
                                    </div>
                                </div>
                             ) : (
                                <>
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
                                </>
                             )}
                            {postLocation && (
                                <Badge variant="secondary" className="mt-2 w-fit">
                                    <MapPin className="mr-2 h-3 w-3" />
                                    {postLocation}
                                     <button onClick={() => setPostLocation(null)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                        <XIcon className="h-3 w-3" />
                                     </button>
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className='mt-auto p-2 border-t shrink-0'>
                    <AnimatePresence>
                    {postEmojis && (
                        <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: 20 }}
                         className='flex justify-around items-center p-2'
                        >
                             {['❤️', '😂', '😍', '😢', '🤔', '🔥', '👍'].map(emoji => (
                                <span key={emoji} className="text-2xl cursor-pointer hover:scale-125 transition-transform" onClick={() => setPostContent(p => p + emoji)}>{emoji}</span>
                            ))}
                        </motion.div>
                    )}
                    </AnimatePresence>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setPostEmojis(!postEmojis)}><Smile className="w-6 h-6"/></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => createFileInputRef.current?.click()}><ImageIcon className="w-6 h-6"/></Button>
                            <input type="file" ref={createFileInputRef} onChange={onSelectPhotoForPost} accept="image/*" className="hidden" />
                            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setShowPollCreator(!showPollCreator)}><ListCollapse className="w-6 h-6"/></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setPostContent(p => p + ' #')}><Hash className="w-6 h-6"/></Button>
                            <Button variant="ghost" size="icon" className={cn("text-muted-foreground", postLocation && "text-primary")} onClick={handleAddLocation}><MapPin className="w-6 h-6"/></Button>
                        </div>
                        <span className="text-sm text-muted-foreground">{postContent.length}/{postContentMaxLength}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>


      <Sheet open={isCommentSheetOpen} onOpenChange={(open) => { if (!open) { setActivePostForComments(null); setCommentInput(''); setCommentImage(null); setReplyingTo(null); } setCommentSheetOpen(open); }}>
            <SheetContent side="bottom" className="rounded-t-xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="text-center p-4 border-b shrink-0">
                    <DialogTitle>Yorumlar</DialogTitle>
                    <SheetClose className="absolute left-4 top-1/2 -translate-y-1/2" />
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                       {isCommentsLoading ? (
                           <div className='flex justify-center items-center h-full'><Loader2 className="w-6 h-6 animate-spin"/></div>
                       ) : activePostForComments && activePostForComments.comments.length > 0 ? (
                            <div className="space-y-4">
                                {activePostForComments.comments.map(comment => (
                                   <CommentComponent key={comment.id} comment={comment} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Henüz yorum yok. İlk yorumu sen yap!</p>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-2 bg-background border-t shrink-0">
                     <form onSubmit={handlePostComment}>
                        <input type="file" ref={commentFileInputRef} onChange={onSelectCommentImage} accept="image/*" className="hidden" />
                        {commentImage && (
                            <div className="p-2 relative w-fit">
                                <Image src={commentImage} alt="Yorum resmi önizlemesi" width={60} height={60} className="rounded-md" />
                                <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setCommentImage(null)}>
                                    <XIcon className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}
                        {replyingTo && (
                            <div className="px-2 py-1 text-xs text-muted-foreground flex items-center justify-between">
                                <span>Yanıtlanıyor: @{replyingTo.username}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setReplyingTo(null); setCommentInput(''); }}><XIcon className="w-3 h-3"/></Button>
                            </div>
                        )}
                        <div className="flex items-center gap-4 px-2 py-1">
                            {['❤️', '👏', '😂', '🔥', '😢'].map(emoji => (
                                <span key={emoji} className="text-2xl cursor-pointer" onClick={() => handleAddEmoji(emoji)}>{emoji}</span>
                            ))}
                            <div className="ml-auto text-xs text-muted-foreground">
                                {commentInput.length} / {commentMaxLength}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={currentUser?.photoURL || "https://placehold.co/40x40.png"} data-ai-hint="current user portrait" />
                                <AvatarFallback>{currentUser?.displayName?.charAt(0) || 'B'}</AvatarFallback>
                            </Avatar>
                             <div className="relative flex-1">
                                 <Button type="button" size="icon" variant="ghost" className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground" onClick={() => commentFileInputRef.current?.click()}>
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                                <MentionTextarea 
                                    isInput={true}
                                    placeholder={replyingTo ? `@${replyingTo.username} adlı kullanıcıya yanıt ver...` : "Yorum ekle..."}
                                    value={commentInput}
                                    setValue={setCommentInput}
                                    onEnterPress={() => handlePostComment}
                                    disabled={isPostingComment}
                                    className="pl-10"
                                />
                                <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full" disabled={isPostingComment || (!commentInput.trim() && !commentImage)}>
                                    {isPostingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
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
        
        <Sheet open={isVotersSheetOpen} onOpenChange={setIsVotersSheetOpen}>
            <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0">
                <SheetHeader className="text-center p-4 border-b shrink-0">
                    <SheetTitle>
                        Oy Verenler
                        {activePoll && <span className="text-muted-foreground font-normal ml-2">({activePoll.poll?.totalVotes || 0})</span>}
                    </SheetTitle>
                    <SheetClose className="absolute left-4 top-1/2 -translate-y-1/2" />
                </SheetHeader>
                <ScrollArea className="flex-1">
                    {isVotersLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : voters.length > 0 ? (
                        <div className="divide-y">
                            {voters.map(({ user, votedOptionText }) => (
                                <div key={user.uid} className="flex items-center p-4 gap-4">
                                    <Link href={`/profile/${user.username}`} className="flex items-center gap-4 flex-1" onClick={() => setIsVotersSheetOpen(false)}>
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={user.avatarUrl} data-ai-hint={user.name} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold truncate">{user.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                                        </div>
                                    </Link>
                                    <Badge variant="outline" className="ml-auto shrink-0">
                                        {votedOptionText}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-10 flex flex-col items-center">
                            <ListIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p>Henüz kimse oy kullanmadı.</p>
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    </div>
  );
}

    
