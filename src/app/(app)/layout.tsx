
'use client';

import React, { type ReactNode, useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search, Shuffle, Bell, Globe, Loader2, LogOut, Settings, Sofa } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { NetworkStatusBanner } from '@/components/ui/network-status-banner';
import { auth, db, setupPresence } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { logActivity } from '@/ai/flows/log-activity-flow';


const NavButton = ({ href, icon, srText, hasNotification = false }: { href: string, icon: React.ReactNode, srText: string, hasNotification?: boolean }) => {
    return (
        <Link href={href}>
            <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8">
                {icon}
                {hasNotification && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full border-2 border-background bg-red-500 animate-pulse-heart" />
                )}
                <span className="sr-only">{srText}</span>
            </Button>
        </Link>
    );
};

function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isScrolling, setIsScrolling] = useState(false);
  const [animationsDisabled, setAnimationsDisabled] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isOnline, isPoorConnection } = useNetworkStatus();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{username?: string, name?: string, email?:string, avatarUrl?: string} | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const activityLoggedRef = useRef(false);

  // Hydration fix state
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
    const storedPreference = localStorage.getItem('disableAnimations');
    setAnimationsDisabled(storedPreference === 'true');
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        setupPresence(user.uid);
        // Fetch only if profile is not already loaded or user has changed
        if (!currentUserProfile || currentUser?.uid !== user.uid) {
            setLoadingProfile(true);
            try {
              const userDocRef = doc(db, "users", user.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const profileData = userDocSnap.data();
                setCurrentUserProfile(profileData);
                
                // Log activity only once per session, and only when we have the data
                if (!activityLoggedRef.current && profileData.name && profileData.avatarUrl) {
                  fetch('https://api.ipify.org?format=json')
                    .then(res => res.json())
                    .then(data => {
                      logActivity({
                          userId: user.uid,
                          userName: profileData.name,
                          userAvatar: profileData.avatarUrl,
                          ipAddress: data.ip,
                          userAgent: navigator.userAgent
                      });
                      activityLoggedRef.current = true;
                    }).catch(err => console.error("Could not fetch IP for logging:", err));
                }
              } else {
                 setCurrentUserProfile(null);
              }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setCurrentUserProfile(null);
            } finally {
              setLoadingProfile(false);
            }
        }
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
        setLoadingProfile(false);
        activityLoggedRef.current = false;
      }
    });
    return () => unsubscribeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentUser) {
        setHasUnreadMessages(false);
        setHasUnreadNotifications(false);
        return;
    };

    // Listener for unread notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      where('read', '==', false)
    );
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      setHasUnreadNotifications(!snapshot.empty);
    }, (error) => {
        console.error("Error fetching notification status:", error);
        setHasUnreadNotifications(false);
    });
    
    // Listener for unread messages
    const conversationsQuery = query(
        collection(db, 'conversations'),
        where('users', 'array-contains', currentUser.uid)
    );
    const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
        let unreadFound = false;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.lastMessage && data.lastMessage.senderId !== currentUser.uid && !data.lastMessage.readBy?.includes(currentUser.uid)) {
                unreadFound = true;
                break; 
            }
        }
        setHasUnreadMessages(unreadFound);
    }, (error) => {
        console.error("Error fetching message status:", error);
        setHasUnreadMessages(false);
    });


    return () => {
        unsubscribeNotifications();
        unsubscribeConversations();
    };
  }, [currentUser]);


  const isChatPage = pathname === '/chat';
  const isChatViewOpen = isChatPage && (searchParams.has('userId') || searchParams.has('conversationId'));
  const isCreatePage = pathname === '/create';
  
  // Check if it's an admin page
  const isAdminPage = isClientReady && pathname.startsWith('/admin');

  const showNavs = isClientReady && !isCreatePage && (!isChatPage || (isChatPage && !isChatViewOpen)) && !isAdminPage;
  const isFullScreen = isClientReady && ((isChatPage && isChatViewOpen) || isAdminPage);

  useEffect(() => {
    const handleScroll = () => {
      if (animationsDisabled) {
        setIsScrolling(false);
        return;
      }
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150); 
    };

    if (showNavs) {
       window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
        setIsScrolling(false);
    }
   
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [showNavs, animationsDisabled]);

  const handleLogout = async () => {
    await signOut(auth);
    toast({
        title: 'Çıkış Yapıldı',
        description: 'Başarıyla çıkış yaptınız.',
    });
    router.push('/login');
  };


  return (
        <div 
            className="flex min-h-screen flex-col bg-background text-foreground"
            style={{
                paddingTop: showNavs ? 'var(--header-height)' : '0',
                paddingBottom: showNavs ? 'var(--bottom-nav-height)' : '0',
            } as React.CSSProperties}
        >
        <NetworkStatusBanner isOnline={isOnline} isPoorConnection={isPoorConnection} />
        {showNavs && !isFullScreen && (
          <>
            <header className={cn(
                "fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-background/80 px-4 backdrop-blur-sm transition-transform duration-300 md:px-6",
                "h-[var(--header-height)]",
                !isOnline || isPoorConnection ? 'top-10' : 'top-0', 
                isScrolling && "-translate-y-full"
            )}>
                <Link href="/explore" className="flex items-center gap-2 text-lg font-semibold">
                    <Heart className="h-7 w-7 text-primary" />
                    <span className="font-bold">BeMatch</span>
                </Link>
                <div className="flex items-center gap-2">
                    <NavButton href="/search" icon={<Search className="h-5 w-5" />} srText="Ara" />
                    <NavButton href="/notifications" icon={<Bell className="h-5 w-5" />} srText="Bildirimler" hasNotification={hasUnreadNotifications} />
                    <NavButton href="/chat" icon={<MessageCircle className="h-5 w-5" />} srText="Mesajlar" hasNotification={hasUnreadMessages} />
                    {loadingProfile ? (
                         <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8" disabled>
                           <Loader2 className="h-5 w-5 animate-spin" />
                         </Button>
                    ) : currentUser && (
                       <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
                                    <Avatar className='h-8 w-8'>
                                        {currentUserProfile?.avatarUrl && <AvatarImage src={currentUserProfile.avatarUrl}/>}
                                        <AvatarFallback>{currentUserProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                               </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-56">
                               <DropdownMenuLabel>
                                   <p className='font-bold truncate'>{currentUserProfile?.name}</p>
                                   <p className='text-xs text-muted-foreground font-normal truncate'>{currentUserProfile?.email}</p>
                               </DropdownMenuLabel>
                               <DropdownMenuSeparator />
                                <Link href={currentUserProfile?.username ? `/profile/${currentUserProfile.username}` : '/profile'}>
                                   <DropdownMenuItem>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profil</span>
                                   </DropdownMenuItem>
                                </Link>
                                 <Link href="/profile/edit">
                                   <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Ayarlar</span>
                                   </DropdownMenuItem>
                                </Link>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                   <LogOut className="mr-2 h-4 w-4" />
                                   <span>Çıkış Yap</span>
                               </DropdownMenuItem>
                           </DropdownMenuContent>
                       </DropdownMenu>
                    )}
                </div>
            </header>
          </>
        )}
        
        <main className={cn("flex-1 w-full", isFullScreen ? "" : "h-full")}>
             {children}
        </main>

        {showNavs && !isFullScreen && (
            <nav className={cn(
                "fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/80 backdrop-blur-sm transition-transform duration-300 md:hidden",
                "h-[var(--bottom-nav-height)]",
                isScrolling && "translate-y-full"
            )}>
                <div className="grid h-full grid-cols-5">
                    <Link href="/shuffle" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === '/shuffle' ? 'text-primary' : '')}>
                        <Shuffle className={cn('h-6 w-6')} />
                    </Link>
                     <Link href="/match" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === '/match' ? 'text-primary' : '')}>
                        <Home className={cn('h-6 w-6')} />
                    </Link>
                    <Link href="/table" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === '/table' ? 'text-primary' : '')}>
                        <Sofa className={cn('h-6 w-6')} />
                    </Link>
                    <Link href="/explore" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === '/explore' ? 'text-primary' : '')}>
                        <Globe className={cn('h-6 w-6')} />
                    </Link>
                     <Link href={`/profile/${currentUserProfile?.username}`} className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === `/profile/${currentUserProfile?.username}` ? 'text-primary' : '')}>
                        <User className={cn('h-6 w-6')} />
                    </Link>
                </div>
            </nav>
        )}
        </div>
  );
}


export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<div>BeMatch Yükleniyor...</div>}>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    )
}
