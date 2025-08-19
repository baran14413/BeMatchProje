
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck,
  MessageSquare,
  MoreVertical,
  Flag,
  Ban,
  Grid3x3,
  Heart,
  Bookmark,
  UserPlus,
  Settings,
  List,
  Trash2,
  Pencil,
  Crown,
  Loader2,
  GalleryVertical,
  Lock,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { doc, getDoc, collection, query, where, getDocs, DocumentData, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
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
    comments: number;
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
                        <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
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
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [hasGalleryAccess, setHasGalleryAccess] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const currentUser = auth.currentUser;
  const { toast } = useToast();

  useEffect(() => {
    const currentUserId = currentUser?.uid;
    setIsMyProfile(params.id === currentUserId);
  }, [params.id, currentUser]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!params.id) return;
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', params.id as string);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserProfile(userData);

          // Check for gallery access
          if (userData.isGalleryPrivate && currentUser) {
              const permissionDocRef = doc(db, 'users', params.id, 'galleryPermissions', currentUser.uid);
              const permissionDocSnap = await getDoc(permissionDocRef);
              if (permissionDocSnap.exists()) {
                  // TODO: Check for expiry if temporary
                  setHasGalleryAccess(true);
              } else {
                  setHasGalleryAccess(false);
              }
          } else {
              setHasGalleryAccess(true); // Public gallery
          }
          
          const postsQuery = query(collection(db, 'posts'), where('authorId', '==', params.id), orderBy('createdAt', 'desc'));
          const postsSnapshot = await getDocs(postsQuery);
          const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
          setUserPosts(postsData);

        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [params.id, currentUser]);

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
  
  const photoPosts = userPosts.filter(p => p.type === 'photo');

  const showGalleryContent = !userProfile.isGalleryPrivate || hasGalleryAccess || isMyProfile;


  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6 pb-20">
      <div className="flex flex-col gap-6">

        {/* Profile Header */}
        <header className="flex gap-4 items-center">
          <Avatar className="w-24 h-24 border-2 border-primary">
            <AvatarImage src={userProfile.avatarUrl} data-ai-hint={userProfile.aiHint} />
            <AvatarFallback className="text-3xl">{userProfile.name.charAt(0)}</AvatarFallback>
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

        {/* Gallery Tabs */}
        <Tabs defaultValue="feed" className="w-full">
            <div className="flex justify-between items-center">
                 <TabsList>
                    <TabsTrigger value="feed" className="px-3 flex gap-2">
                        <List className="h-5 w-5" />
                        <span className="hidden sm:inline">Akış</span>
                    </TabsTrigger>
                    <TabsTrigger value="gallery" className="px-3 flex gap-2">
                        <Grid3x3 className="h-5 w-5" />
                        <span className="hidden sm:inline">Galeri</span>
                    </TabsTrigger>
                    {isMyProfile && (
                    <>
                        <TabsTrigger value="likes" className="px-3 flex gap-2">
                            <Heart className="h-5 w-5" />
                            <span className="hidden sm:inline">Beğenilenler</span>
                        </TabsTrigger>
                        <TabsTrigger value="saved" className="px-3 flex gap-2">
                            <Bookmark className="h-5 w-5" />
                            <span className="hidden sm:inline">Kaydedilenler</span>
                        </TabsTrigger>
                    </>
                    )}
                </TabsList>
            </div>

          <TabsContent value="feed" className="mt-4">
            <div className="flex flex-col">
                {userPosts.map((post) => (
                    <PostCard key={post.id} post={post} user={userProfile} isMyProfile={isMyProfile}/>
                ))}
            </div>
            {userPosts.length === 0 && (
                <div className='text-center py-10 text-muted-foreground'>
                    <p>Henüz gönderi yok.</p>
                </div>
            )}
          </TabsContent>
           <TabsContent value="gallery" className="mt-4">
                {showGalleryContent ? (
                    <>
                        <div className="grid grid-cols-3 gap-1">
                            {photoPosts.map((post) => (
                                <div key={post.id} className="relative aspect-square rounded-md overflow-hidden group">
                                <Image
                                    src={post.url!}
                                    alt={post.caption || `Post ${post.id}`}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint={post.aiHint}
                                />
                                {isMyProfile && (
                                        <div className="absolute top-1 right-1 flex items-center gap-1">
                                            <Button variant="secondary" size="icon" className="h-7 w-7">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" className="h-7 w-7">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {photoPosts.length === 0 && (
                            <div className='text-center py-10 text-muted-foreground flex flex-col items-center gap-2'>
                                <GalleryVertical className="w-10 h-10" />
                                <p>Henüz fotoğraf yok.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4 rounded-lg border-2 border-dashed">
                        <Lock className="w-12 h-12 text-muted-foreground/50"/>
                        <h3 className="font-bold text-lg text-foreground">Bu Galeri Gizli</h3>
                        <p className="text-sm max-w-xs">
                            {userProfile.name} kullanıcısının fotoğraflarını görmek için erişim izni istemeniz gerekiyor.
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
          </TabsContent>
          {isMyProfile && (
            <>
              <TabsContent value="likes" className="text-center py-10 text-muted-foreground">
                 <Heart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
                 <h3 className='font-bold text-lg'>Beğenilen Gönderiler</h3>
                 <p className='text-sm'>Henüz bir gönderi beğenmedin. Beğendiğin gönderiler burada görünecek.</p>
              </TabsContent>
              <TabsContent value="saved" className="text-center py-10 text-muted-foreground">
                <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
                <h3 className='font-bold text-lg'>Kaydedilenler</h3>
                <p className='text-sm'>Daha sonra kolayca bulmak için gönderileri kaydet.</p>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
