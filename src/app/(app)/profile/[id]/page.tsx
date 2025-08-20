
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
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
  Sparkles,
  UserCheck as UserCheckIcon,
  List,
  Grid3x3,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { doc, getDoc, collection, query, where, getDocs, DocumentData, addDoc, serverTimestamp, orderBy, deleteDoc, runTransaction, increment, writeBatch, documentId } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    isAiEdited?: boolean;
};

type RequestStatus = 'idle' | 'loading' | 'sent';
type FollowListType = 'followers' | 'following';
type FollowUser = {
  uid: string;
  name: string;
  avatarUrl: string;
  isFollowing: boolean; // Is the CURRENT user following THIS person in the list?
};

const PostCard = ({ post, user }: { post: Post, user: DocumentData }) => (
    <Card className="rounded-xl overflow-hidden mb-4 relative group">
        <CardContent className="p-0">
             <div className="flex items-center gap-3 p-3">
                <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl} data-ai-hint={user.aiHint} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                    <div className='flex items-center gap-2'>
                        <span className="font-semibold text-sm">{user.name}</span>
                        {user.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                     {post.isAiEdited && (
                        <Badge variant="outline" className="text-xs w-fit text-purple-500 border-purple-300 mt-1">
                            <Sparkles className="w-3 h-3 mr-1"/>
                            BeAI ile düzenlendi
                        </Badge>
                    )}
                </div>
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
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);
  const [hasGalleryAccess, setHasGalleryAccess] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle' as RequestStatus);
  const [isMyProfile, setIsMyProfile] = useState(false);
  const currentUser = auth.currentUser;
  const { toast } = useToast();
  
  const [followList, setFollowList] = useState<FollowUser[]>([]);
  const [isFollowListLoading, setIsFollowListLoading] = useState(false);
  const [followListType, setFollowListType] = useState<FollowListType | null>(null);
  const [isListSheetOpen, setIsListSheetOpen] = useState(false);

 useEffect(() => {
    const fetchUserProfile = async () => {
      const profileId = params.id as string;
      if (!profileId || !currentUser) {
        if (!currentUser) setLoading(false);
        return;
      }
      setLoading(true);
      
      try {
        const profileIsMine = profileId === currentUser.uid;
        setIsMyProfile(profileIsMine);

        // Fetch user data
        const userDocRef = doc(db, 'users', profileId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserProfile(userData);

          // Check follow status
          if (!profileIsMine) {
            const followDocRef = doc(db, 'users', currentUser.uid, 'following', profileId);
            const followDocSnap = await getDoc(followDocRef);
            setIsFollowing(followDocSnap.exists());
          }

          // Check gallery access
          if (userData.isGalleryPrivate && !profileIsMine) {
              const permissionDocRef = doc(db, 'users', profileId, 'galleryPermissions', currentUser.uid);
              const permissionDocSnap = await getDoc(permissionDocRef);
              setHasGalleryAccess(permissionDocSnap.exists());
          } else {
              setHasGalleryAccess(true);
          }
          
          // Fetch posts
          const postsQuery = query(collection(db, 'posts'), where('authorId', '==', profileId));
          const postsSnapshot = await getDocs(postsQuery);
          const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
          
          postsData.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

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

    if (currentUser) {
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

  const handleFollowToggle = async () => {
    if (!currentUser || !userProfile || isFollowProcessing) return;
    setIsFollowProcessing(true);

    const currentUserRef = doc(db, 'users', currentUser.uid);
    const targetUserRef = doc(db, 'users', userProfile.uid);
    const followingRef = doc(db, 'users', currentUser.uid, 'following', userProfile.uid);
    const followerRef = doc(db, 'users', userProfile.uid, 'followers', currentUser.uid);
    
    try {
        const batch = writeBatch(db);

        if (isFollowing) {
            // Unfollow
            batch.delete(followingRef);
            batch.delete(followerRef);
            batch.update(currentUserRef, { 'stats.following': increment(-1) });
            batch.update(targetUserRef, { 'stats.followers': increment(-1) });
        } else {
            // Follow
            batch.set(followingRef, { uid: userProfile.uid, followedAt: serverTimestamp() });
            batch.set(followerRef, { uid: currentUser.uid, followedAt: serverTimestamp() });
            batch.update(currentUserRef, { 'stats.following': increment(1) });
            batch.update(targetUserRef, { 'stats.followers': increment(1) });
            
            // Create Notification
            const notificationRef = doc(collection(db, 'notifications'));
             batch.set(notificationRef, {
                recipientId: userProfile.uid,
                type: 'follow',
                fromUser: {
                    uid: currentUser.uid,
                    name: currentUser.displayName,
                    avatar: currentUser.photoURL,
                    aiHint: "current user portrait"
                },
                read: false,
                createdAt: serverTimestamp()
            });
        }
        
        await batch.commit();

        setIsFollowing(!isFollowing);
        setUserProfile(prev => {
            if (!prev) return null;
            return {
                ...prev,
                stats: {
                    ...prev.stats,
                    followers: (prev.stats?.followers || 0) + (isFollowing ? -1 : 1),
                }
            }
        });

    } catch (error) {
        console.error("Error toggling follow:", error);
        toast({ variant: 'destructive', title: 'İşlem Başarısız', description: 'Lütfen tekrar deneyin.' });
    } finally {
        setIsFollowProcessing(false);
    }
  };

   const fetchFollowList = async (listType: FollowListType) => {
    if (!userProfile) return;
    setFollowListType(listType);
    setIsFollowListLoading(true);
    setIsListSheetOpen(true);
    setFollowList([]);

    try {
        const listCollectionRef = collection(db, 'users', userProfile.uid, listType);
        const listSnapshot = await getDocs(listCollectionRef);
        const listUserIds = listSnapshot.docs.map(d => d.id);
        
        if (listUserIds.length === 0) {
            setIsFollowListLoading(false);
            return;
        }

        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', listUserIds));
        const usersSnapshot = await getDocs(usersQuery);
        
        // Check which of these users the current user is following
        const myFollowingRef = collection(db, 'users', currentUser!.uid, 'following');
        const myFollowingSnapshot = await getDocs(myFollowingRef);
        const myFollowingIds = new Set(myFollowingSnapshot.docs.map(d => d.id));
        
        const fetchedUsers = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.name,
                avatarUrl: data.avatarUrl,
                isFollowing: myFollowingIds.has(doc.id)
            };
        });

        setFollowList(fetchedUsers);

    } catch (error) {
        console.error(`Error fetching ${listType}:`, error);
        toast({ variant: 'destructive', title: 'Liste alınamadı.' });
    } finally {
        setIsFollowListLoading(false);
    }
  };


  const StatItem = ({ value, label, onClick }: { value: number | undefined, label: string, onClick?: () => void }) => (
      <div className={cn("flex flex-col items-center", onClick && "cursor-pointer")} onClick={onClick}>
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
            <StatItem value={userProfile.stats?.followers} label="Takipçi" onClick={() => fetchFollowList('followers')} />
            <StatItem value={userProfile.stats?.following} label="Takip" onClick={() => fetchFollowList('following')} />
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
                    <Button className="flex-1" onClick={handleFollowToggle} disabled={isFollowProcessing}>
                        {isFollowProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                           isFollowing ? <UserCheckIcon className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />
                        }
                        {isFollowing ? 'Takibi Bırak' : 'Takip Et'}
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
                        userPosts.map((post) => <PostCard key={post.id} post={post} user={userProfile} />)
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
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
      
       <Sheet open={isListSheetOpen} onOpenChange={setIsListSheetOpen}>
          <SheetContent side="bottom" className="h-[80vh] flex flex-col">
              <SheetHeader className="text-center p-4 border-b shrink-0">
                  <SheetTitle>
                    {followListType === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                    <span className="text-muted-foreground font-normal ml-2">({followList.length})</span>
                  </SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1">
                  {isFollowListLoading ? (
                      <div className="flex justify-center items-center h-full">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                  ) : followList.length > 0 ? (
                      <div className="divide-y">
                          {followList.map(user => (
                              <div key={user.uid} className="flex items-center p-4 gap-4">
                                  <Avatar className="w-12 h-12">
                                      <AvatarImage src={user.avatarUrl} data-ai-hint={user.name} onClick={() => { setIsListSheetOpen(false); router.push(`/profile/${user.uid}`);}}/>
                                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 overflow-hidden" onClick={() => { setIsListSheetOpen(false); router.push(`/profile/${user.uid}`);}}>
                                      <p className="font-semibold truncate">{user.name}</p>
                                  </div>
                                  {user.uid !== currentUser?.uid && (
                                     <Button size="sm" variant={user.isFollowing ? 'outline' : 'default'}>
                                        {user.isFollowing ? 'Takibi Bırak' : 'Takip Et'}
                                    </Button>
                                  )}
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center text-muted-foreground p-10">
                          <List className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50"/>
                          <p>Henüz kimse yok.</p>
                      </div>
                  )}
              </ScrollArea>
          </SheetContent>
      </Sheet>
    </div>
  );
}

    
