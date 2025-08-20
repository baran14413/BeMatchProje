
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ShieldCheck,
  MessageSquare,
  MoreVertical,
  Flag,
  Ban,
  Heart,
  Bookmark,
  UserPlus,
  Settings,
  Pencil,
  Crown,
  Loader2,
  Lock,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { doc, getDoc, collection, query, where, getDocs, DocumentData, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type Post = {
    id: string;
    type: 'photo' | 'text';
    url?: string;
    aiHint?: string;
    textContent?: string;
    caption?: string;
    likes: number;
    commentsCount: number;
    createdAt: { seconds: number, nanoseconds: number };
};

type RequestStatus = 'idle' | 'loading' | 'sent';

const PostCard = ({ post, user, isMyProfile }: { post: Post, user: DocumentData, isMyProfile: boolean }) => (
    <Card className="rounded-xl overflow-hidden mb-4 relative group">
        <CardContent className="p-0">
             <div className="flex items-center gap-3 p-3">
                <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl} data-ai-hint={user.aiHint} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex items-center gap-2'>
                    <span className="font-semibold text-sm">{user.name}</span>
                    {user.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                </div>
                 {isMyProfile && (
                    <div className="flex items-center gap-1 ml-auto">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
            
            {post.type === 'photo' && post.url && (
                 <div className="relative w-full aspect-square">
                    <Image
                        src={post.url}
                        alt={post.caption || `Post by ${user.name}`}
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
                {(post.caption || (post.type === 'photo' && !post.textContent)) && (
                     <p>
                        <span className="font-semibold">{user.name}</span>{' '}
                        {post.caption}
                    </p>
                )}
                 {post.type === 'text' && post.textContent && (
                    <p>
                        <span className="font-semibold">{user.name}</span>{' '}
                        {post.textContent}
                    </p>
                )}
                {post.commentsCount > 0 && (
                    <p className="text-muted-foreground mt-1 cursor-pointer">
                    {post.commentsCount.toLocaleString()} yorumun tümünü gör
                    </p>
                )}
            </div>
        </CardContent>
    </Card>
)

const ProfileSkeleton = () => (
  <div className="flex flex-col gap-6">
    <header className="flex gap-4 items-center">
      <Skeleton className="w-24 h-24 rounded-full" />
      <div className="flex-1 grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center gap-1"><Skeleton className="h-6 w-8" /><Skeleton className="h-4 w-16" /></div>
        <div className="flex flex-col items-center gap-1"><Skeleton className="h-6 w-8" /><Skeleton className="h-4 w-16" /></div>
        <div className="flex flex-col items-center gap-1"><Skeleton className="h-6 w-8" /><Skeleton className="h-4 w-16" /></div>
      </div>
    </header>
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="flex gap-2 w-full">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 flex-1" />
    </div>
  </div>
);


export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGalleryAccess, setHasGalleryAccess] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [isMyProfile, setIsMyProfile] = useState(false);
  const currentUser = auth.currentUser;
  const { toast } = useToast();

 useEffect(() => {
    const fetchUserProfile = async () => {
      if (!params.id || !currentUser) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      try {
        const profileIsMine = params.id === currentUser.uid;
        setIsMyProfile(profileIsMine);

        const userDocRef = doc(db, 'users', params.id as string);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserProfile(userData);

          if (userData.isGalleryPrivate && !profileIsMine) {
              const permissionDocRef = doc(db, 'users', params.id, 'galleryPermissions', currentUser.uid);
              const permissionDocSnap = await getDoc(permissionDocRef);
              setHasGalleryAccess(permissionDocSnap.exists());
          } else {
              setHasGalleryAccess(true);
          }
          
          const postsQuery = query(collection(db, 'posts'), where('authorId', '==', params.id));
          const postsSnapshot = await getDocs(postsQuery);
          const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
          
          postsData.sort((a, b) => {
              const dateA = a.createdAt?.seconds ?? 0;
              const dateB = b.createdAt?.seconds ?? 0;
              return dateB - dateA;
          });

          setUserPosts(postsData);

        } else {
          console.log("No such document!");
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({ variant: 'destructive', title: 'Profil Yüklenemedi', description: 'Profil bilgileri alınırken bir hata oluştu.' });
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && params.id) {
        fetchUserProfile();
    }
  }, [params.id, currentUser, toast]);


  const handleRequestAccess = async () => {
      if (!currentUser || !userProfile) return;
      setRequestStatus('loading');
      try {
          await addDoc(collection(db, 'notifications'), {
              recipientId: userProfile.uid,
              type: 'gallery_request',
              fromUser: {
                  uid: currentUser.uid,
                  name: currentUser.displayName,
                  avatar: currentUser.photoURL,
              },
              read: false,
              createdAt: serverTimestamp()
          });
          setRequestStatus('sent');
          toast({ title: 'İstek Gönderildi', description: `${userProfile.name} isteğinizi aldığında size bildireceğiz.` });
      } catch (error) {
          console.error("Error sending access request:", error);
          toast({ variant: 'destructive', title: 'İstek Gönderilemedi' });
          setRequestStatus('idle');
      }
  };


  const StatItem = ({ value, label }: { value: number | undefined, label: string }) => (
      <div className="flex flex-col items-center">
          <p className="text-xl font-bold">{value ?? 0}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
      </div>
  );
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl p-4 md:p-6 pb-20">
          <ProfileSkeleton />
      </div>
    );
  }
  
  if (!userProfile) {
    return <div className="text-center py-20">Kullanıcı bulunamadı.</div>
  }
  
  const showGalleryContent = !userProfile.isGalleryPrivate || hasGalleryAccess || isMyProfile;


  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6 pb-20">
      <div className="flex flex-col gap-6">

        {/* Profile Header */}
        <header className="flex gap-4 items-center">
          <Avatar className="w-24 h-24 border-2 border-primary">
            <AvatarImage src={userProfile.avatarUrl} data-ai-hint={userProfile.aiHint} />
            <AvatarFallback className="text-3xl">{userProfile.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 grid grid-cols-3 gap-4 text-center">
            <StatItem value={userPosts.length} label="Gönderi" />
            <StatItem value={userProfile.stats?.followers} label="Takipçi" />
            <StatItem value={userProfile.stats?.following} label="Takip" />
          </div>
        </header>

        {/* Bio Section */}
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                 <h1 className="text-lg font-bold">{userProfile.name}</h1>
                 {userProfile.isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <p className="text-xs font-medium text-green-600">Doğrulanmış Profil</p>
            </div>
             <p className="text-muted-foreground text-sm mt-2">{userProfile.bio}</p>
        </div>


        {/* Action Buttons */}
        <div className="flex gap-2 w-full">
            {isMyProfile ? (
                 <Link href="/profile/edit" className="w-full">
                    <Button variant="outline" className="w-full">
                        <Settings className="mr-2 h-4 w-4" /> Profili Düzenle
                    </Button>
                </Link>
            ) : (
                <>
                    <Button className="flex-1">
                        <UserPlus className="mr-2 h-4 w-4" /> Takip Et
                    </Button>
                    <Link href={`/chat?userId=${params.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full">
                            <MessageSquare className="mr-2 h-4 w-4" /> Mesaj Gönder
                        </Button>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Daha Fazla</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Flag className="mr-2 h-4 w-4" />
                            <span>Şikayet Et</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Ban className="mr-2 h-4 w-4" />
                            <span>Engelle</span>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
        </div>

        {/* Interests */}
        <div className="flex flex-wrap gap-2">
            {userProfile.hobbies?.map((interest: string) => (
              <Badge key={interest} variant="secondary" className="text-xs rounded-md">
                {interest}
              </Badge>
            ))}
        </div>
        
        <Separator />

        {/* Posts Section */}
        <div>
            {showGalleryContent ? (
                <div>
                    {userPosts.length > 0 ? (
                    userPosts.map((post) => (
                        <PostCard key={post.id} post={post} user={userProfile} isMyProfile={isMyProfile}/>
                    ))
                    ) : (
                    <div className='text-center py-10 text-muted-foreground'>
                        <p>Henüz gönderi yok.</p>
                    </div>
                    )}
                </div>
            ) : (
                 <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4 rounded-lg border-2 border-dashed">
                    <Lock className="w-12 h-12 text-muted-foreground/50"/>
                    <h3 className="font-bold text-lg text-foreground">Bu Galeri Gizli</h3>
                    <p className="text-sm max-w-xs">
                        {userProfile.name} kullanıcısının gönderilerini görmek için erişim izni istemeniz gerekiyor.
                    </p>
                    <Button 
                        onClick={handleRequestAccess} 
                        disabled={requestStatus !== 'idle'}
                    >
                        {requestStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {requestStatus === 'sent' ? 'İstek Gönderildi' : 'İzin İste'}
                    </Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
