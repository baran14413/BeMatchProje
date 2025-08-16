
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Grid3x3, List, Heart, MessageSquare, Bookmark, Pencil, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, DocumentData, deleteDoc, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


type Post = {
    id: string;
    type: 'photo' | 'text';
    url?: string;
    aiHint?: string;
    textContent?: string;
    caption?: string;
    likes: number;
    comments: number;
};


const PostCard = ({ post, user, onDelete }: { post: Post, user: DocumentData, onDelete: (postId: string) => void }) => (
    <Card className="rounded-xl overflow-hidden mb-4 relative group">
        <CardContent className="p-0">
            <div className="flex items-center gap-3 p-3">
                <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl} data-ai-hint={user.aiHint} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{user.name}</span>
                 <div className="flex items-center gap-1 ml-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDelete(post.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {post.type === 'photo' && post.url && (
                <div className="relative w-full aspect-square">
                    <Image
                    src={post.url}
                    alt={`Post by ${user.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint={post.aiHint}
                    />
                </div>
            )}
            
            {post.type === 'text' && (
                <div className="px-4 py-6 bg-muted/30">
                     <p className="text-base whitespace-pre-wrap break-words">{post.textContent}</p>
                </div>
            )}

            <div className="flex items-center justify-between p-3">
                <div className='flex items-center gap-3'>
                    <Button variant="ghost" size="icon">
                        <Heart className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MessageSquare className="w-6 h-6" />
                    </Button>
                </div>
                <Button variant="ghost" size="icon">
                    <Bookmark className="w-6 h-6" />
                </Button>
            </div>

            <div className="px-3 pb-3 text-sm">
                <p className="font-semibold">{post.likes.toLocaleString()} beğeni</p>
                {(post.caption || (post.type === 'photo' && post.textContent)) && (
                     <p>
                        <span className="font-semibold">{user.name}</span>{' '}
                        {post.caption || post.textContent}
                    </p>
                )}
                {post.comments > 0 && (
                    <p className="text-muted-foreground mt-1 cursor-pointer">
                    {post.comments.toLocaleString()} yorumun tümünü gör
                    </p>
                )}
            </div>
        </CardContent>
    </Card>
);

export default function ManagePhotosPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                setUserProfile(userDoc.exists() ? userDoc.data() : null);

                const postsQuery = query(collection(db, 'posts'), where('authorId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
                const postsSnapshot = await getDocs(postsQuery);
                const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
                setPosts(postsData);

            } catch (error) {
                console.error("Error fetching user data and posts:", error);
                toast({ variant: 'destructive', title: "Veriler alınırken bir hata oluştu." });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser, toast]);
    
    const handleDeletePost = async (postId: string) => {
        try {
            await deleteDoc(doc(db, "posts", postId));
            setPosts(prev => prev.filter(p => p.id !== postId));
            toast({ title: "Gönderi silindi." });
        } catch (error) {
            console.error("Error deleting post:", error);
            toast({ variant: 'destructive', title: "Gönderi silinirken hata oluştu." });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gönderilerini Yönet</CardTitle>
                    <CardDescription>
                        Tüm gönderilerinizi görüntüleyin ve yönetin.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                        <Grid3x3 className="w-5 h-5"/>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                        <List className="w-5 h-5"/>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : viewMode === 'grid' ? (
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {posts.filter(p => p.type === 'photo').map(post => (
                            <div key={post.id} className="relative group aspect-square">
                                <Image 
                                    src={post.url!} 
                                    alt={post.caption || `Post ${post.id}`}
                                    fill 
                                    className="object-cover rounded-md"
                                    data-ai-hint={post.aiHint}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 gap-2">
                                   <Button variant="secondary" size="icon" className="h-9 w-9">
                                       <Pencil className="h-4 w-4" />
                                   </Button>
                                   <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => handleDeletePost(post.id)}>
                                       <Trash2 className="h-4 w-4" />
                                   </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {userProfile && posts.map((post) => (
                           <PostCard key={post.id} post={post} user={userProfile} onDelete={handleDeletePost} />
                        ))}
                    </div>
                )}
                 {posts.length === 0 && !loading && (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>Henüz gönderi yok.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
