
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, getDocs, DocumentData, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import React from 'react';


const HashtagAndMentionRenderer = ({ text }: { text: string }) => {
    const parts = text.split(/(#\w+|@\w+)/g);
    return (
        <p>
            {parts.map((part, i) => {
                if (part.startsWith('#')) {
                    return (
                        <Link key={i} href={`/tag/${part.substring(1)}`} className="text-blue-500 hover:underline">
                            {part}
                        </Link>
                    );
                }
                if (part.startsWith('@')) {
                     return (
                        <Link key={i} href={`/profile/${part.substring(1)}`} className="text-blue-500 hover:underline">
                            {part}
                        </Link>
                    );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </p>
    );
};


type Post = {
    id: string;
    type: 'photo' | 'text';
    url?: string;
    caption?: string;
    textContent?: string;
    likes: number;
    commentsCount: number;
    authorId: string;
    user?: DocumentData; 
};

const PostSkeleton = () => (
    <Card className="w-full rounded-none md:rounded-xl overflow-hidden shadow-none md:shadow-sm border-0 md:border-b">
        <CardContent className="p-0">
            <div className="flex items-center gap-3 p-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="w-full aspect-square" />
        </CardContent>
    </Card>
);

export default function TagPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const tag = decodeURIComponent(params.tag as string);

    useEffect(() => {
        if (!tag) return;

        const fetchPostsByTag = async () => {
            setLoading(true);
            try {
                const postsQuery = query(collection(db, 'posts'), where('hashtags', 'array-contains', tag));
                const querySnapshot = await getDocs(postsQuery);
                
                const postsData = await Promise.all(querySnapshot.docs.map(async (postDoc) => {
                    const postData = postDoc.data();
                    const userDocRef = doc(db, 'users', postData.authorId);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        return {
                            id: postDoc.id,
                            ...postData,
                            user: userDocSnap.data()
                        } as Post;
                    }
                    return null;
                }));

                setPosts(postsData.filter(p => p !== null) as Post[]);
            } catch (error) {
                console.error("Error fetching posts by tag: ", error);
                toast({
                    variant: 'destructive',
                    title: 'Gönderiler Yüklenemedi',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPostsByTag();
    }, [tag, toast]);

    return (
        <div className="container mx-auto max-w-lg p-0 md:p-4 pb-20">
            <header className="flex items-center gap-4 p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5"/>
                </Button>
                <div>
                    <h1 className="text-xl font-bold">#{tag}</h1>
                    <p className="text-sm text-muted-foreground">{posts.length} gönderi</p>
                </div>
            </header>
            
            <div className="flex flex-col mt-4">
                {loading ? (
                    <>
                        <PostSkeleton />
                        <PostSkeleton />
                    </>
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <Card key={post.id} className="w-full rounded-none md:rounded-xl overflow-hidden shadow-none border-0 md:border-b mb-4">
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between gap-3 p-3">
                                    <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={post.user?.avatarUrl} />
                                            <AvatarFallback>{post.user?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-sm">{post.user?.name}</span>
                                    </Link>
                                </div>
                                {post.type === 'photo' && post.url && (
                                    <div className="relative w-full aspect-square">
                                        <Image
                                            src={post.url}
                                            alt={`Post by ${post.user?.name}`}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    </div>
                                )}
                                {post.type === 'text' && post.textContent && (
                                     <div className="px-4 py-8 bg-muted/20">
                                        <HashtagAndMentionRenderer text={post.textContent} />
                                     </div>
                                )}
                                <div className="p-3">
                                    <div className='flex items-center gap-3 mb-2'>
                                        <Button variant="ghost" size="icon">
                                            <Heart className="w-6 h-6" />
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <MessageCircle className="w-6 h-6" />
                                        </Button>
                                    </div>
                                    <span className="font-semibold text-sm">{post.likes.toLocaleString()} beğeni</span>
                                    {post.caption && (
                                        <div className='text-sm mt-1'>
                                            <Link href={`/profile/${post.authorId}`} className="font-semibold mr-1">{post.user?.name}</Link>
                                            <HashtagAndMentionRenderer text={post.caption} />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-20">
                        <p className="text-lg">Bu etiketle ilgili gönderi bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
