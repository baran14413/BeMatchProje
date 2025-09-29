
'use client';

import React, { type ReactNode, useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search, Shuffle, Bell, Globe, Loader2, LogOut, Settings, Sparkles, X, Users2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { NetworkStatusBanner } from '@/components/ui/network-status-banner';
import { auth, db, setupPresence } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit, updateDoc } from 'firebase/firestore';
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
import { motion, AnimatePresence } from 'framer-motion';
import AppLockScreen from '@/components/ui/app-lock-screen';
import { useNotification } from '@/hooks/use-notifications';

const NavButton = ({ href, icon, srText, isActive, hasNotification = false }: { href: string, icon: React.ReactNode, srText: string, isActive: boolean, hasNotification?: boolean }) => {
    return (
        <Link href={href} className="flex flex-col items-center justify-center gap-1 w-full h-full relative">
            <motion.div whileTap={{ scale: 0.9 }} className="relative flex flex-col items-center justify-center">
                 {React.cloneElement(icon as React.ReactElement, {
                    className: cn('h-6 w-6 transition-all', isActive ? 'text-primary' : 'text-muted-foreground'),
                    strokeWidth: 2
                })}
                {hasNotification && (
                    <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full border-2 border-background bg-red-500 animate-pulse-heart" />
                )}
            </motion.div>
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
  const [lastNotification, setLastNotification] = useState<{ id: string, text: string } | null>(null);
  const activityLoggedRef = useRef(false);
  const lastShownNotificationIdRef = useRef<string | null>(null);
  
  const [isClientReady, setIsClientReady] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);

  // Initialize notification hook
  useNotification();

   useEffect(() => {
    const lockConfig = localStorage.getItem('app-lock-config');
    if (lockConfig) {
      const { isEnabled } = JSON.parse(lockConfig);
      setIsLocked(isEnabled);
    } else {
      setIsLocked(false);
    }

    // Disable right-click context menu and dev tools
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    setIsClientReady(true);
    const storedPreference = localStorage.getItem('disableAnimations');
    setAnimationsDisabled(storedPreference === 'true');

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

   useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        setupPresence(user.uid);
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
        setLoadingProfile(false);
        activityLoggedRef.current = false;
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setLoadingProfile(true);
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
      if (userDocSnap.exists()) {
        const profileData = userDocSnap.data();
        const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/tutorial');
        
        if (!profileData.username || !profileData.city || !profileData.age || !profileData.hobbies?.length) {
            if (!isAuthPage) {
                const googleInfo = { email: currentUser.email, firstName: currentUser.displayName?.split(' ')[0] || '', lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '', photoURL: currentUser.photoURL };
                sessionStorage.setItem('googleSignUpInfo', JSON.stringify(googleInfo));
                router.push('/signup?step=1&source=google&reason=complete_profile');
                return;
            }
        }
        setCurrentUserProfile(profileData);

        if (!sessionStorage.getItem('welcomeMessageShown')) {
            const welcomeText = `Hoş geldin, ${profileData.name?.split(' ')[0]}! ❤️`;
            toast({ title: welcomeText, duration: 6000 });
            sessionStorage.setItem('welcomeMessageShown', 'true');
        }

        if (!activityLoggedRef.current && profileData.name && profileData.avatarUrl) {
            fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => {
                logActivity({ userId: currentUser.uid, userName: profileData.name, userAvatar: profileData.avatarUrl, ipAddress: data.ip, userAgent: navigator.userAgent, activity: 'Giriş yapıldı' });
                activityLoggedRef.current = true;
            }).catch(err => console.error("Could not fetch IP for logging:", err));
        }
      } else {
         if (!pathname.startsWith('/signup')) {
            const googleInfo = { email: currentUser.email, firstName: currentUser.displayName?.split(' ')[0] || '', lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '', photoURL: currentUser.photoURL };
            sessionStorage.setItem('googleSignUpInfo', JSON.stringify(googleInfo));
            router.push('/signup?step=1&source=google');
        }
        setCurrentUserProfile(null);
      }
      setLoadingProfile(false);
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setCurrentUserProfile(null);
        setLoadingProfile(false);
    });

    return () => unsubscribeProfile();
}, [currentUser, pathname, router, toast]);

  useEffect(() => {
    if (!currentUser) {
        setHasUnreadMessages(false);
        return;
    };

    const notificationsQuery = query(collection(db, 'notifications'), where('recipientId', '==', currentUser.uid), where('read', '==', false), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribeNotifications = onSnapshot(notificationsQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const newNotifDoc = snapshot.docs[0];
        const newNotif = newNotifDoc.data();
        const newNotifId = newNotifDoc.id;
        if (newNotifId !== lastShownNotificationIdRef.current) {
          const text = newNotif.type === 'like' ? `**${newNotif.fromUser.name}** bir gönderini beğendi.` : newNotif.type === 'follow' ? `**${newNotif.fromUser.name}** seni takip etmeye başladı.` : `**${newNotif.fromUser.name}** gönderine yorum yaptı.`;
          setLastNotification({ id: newNotifId, text });
          lastShownNotificationIdRef.current = newNotifId;
          const notifRef = doc(db, 'notifications', newNotifId);
          await updateDoc(notifRef, { read: true });
        }
      }
    }, (error) => console.error("Error fetching notification status:", error));
    
    const conversationsQuery = query(collection(db, 'conversations'), where('users', 'array-contains', currentUser.uid));
    const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
        let unreadFound = false;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.lastMessage && data.lastMessage.senderId !== currentUser.uid && !data.lastMessage.readBy?.includes(currentUser.uid)) { unreadFound = true; break; }
        }
        setHasUnreadMessages(unreadFound);
    }, (error) => { console.error("Error fetching message status:", error); setHasUnreadMessages(false); });

    return () => {
        unsubscribeNotifications();
        unsubscribeConversations();
    };
  }, [currentUser]);


  const isChatPage = pathname === '/chat';
  const isChatViewOpen = isChatPage && (searchParams.has('userId') || searchParams.has('conversationId'));
  const isRandomChatPage = pathname.startsWith('/random-chat');
  const isAdminPage = isClientReady && pathname.startsWith('/admin');
  const isCreatePostPage = pathname === '/create-post';

  // Determine if the full screen layout should be shown (no nav bars)
  const isFullScreen = isClientReady && (isChatViewOpen || isAdminPage || isRandomChatPage || isCreatePostPage);

  // Show navs on most pages, but hide for full screen views
  const showNavs = isClientReady && !isFullScreen;
  
  useEffect(() => {
    const handleScroll = () => {
      if (animationsDisabled) { setIsScrolling(false); return; }
      setIsScrolling(true);
      if (scrollTimeoutRef.current) { clearTimeout(scrollTimeoutRef.current); }
      scrollTimeoutRef.current = setTimeout(() => { setIsScrolling(false); }, 150); 
    };
    if (showNavs) { window.addEventListener('scroll', handleScroll, { passive: true }); } 
    else { setIsScrolling(false); }
    return () => { window.removeEventListener('scroll', handleScroll); if (scrollTimeoutRef.current) { clearTimeout(scrollTimeoutRef.current); } };
  }, [showNavs, animationsDisabled]);

  if (isLocked === null) {
      return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (isLocked) {
      return <AppLockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <>
        <div 
            className="flex min-h-screen flex-col bg-background text-foreground"
            style={{ paddingTop: showNavs ? 'var(--header-height)' : '0', paddingBottom: showNavs ? 'var(--bottom-nav-height)' : '0' } as React.CSSProperties}
        >
        <NetworkStatusBanner isOnline={isOnline} isPoorConnection={isPoorConnection} />
        {showNavs && (
            <header className={cn("fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-background/70 px-4 backdrop-blur-sm transition-transform duration-300 md:px-6", "h-[var(--header-height)]", !isOnline || isPoorConnection ? 'top-10' : 'top-0', isScrolling && "-translate-y-full")}>
               <div className="flex flex-1 items-center gap-2">
                    <Link href="/explore" className="flex items-center gap-2">
                         <h1 className="text-2xl font-bold font-headline bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">BeMatch</h1>
                        <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
                    </Link>
              </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8" asChild><Link href="/create-post"><Plus className="h-5 w-5" /></Link></Button>
                    <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8" asChild><Link href="/notifications"><Bell className="h-5 w-5" /></Link></Button>
                    <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8" asChild>
                       <Link href="/chat">
                         <MessageCircle className="h-5 w-5" />
                         {hasUnreadMessages && <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full border-2 border-background bg-red-500 animate-pulse-heart" />}
                       </Link>
                    </Button>
                    {loadingProfile ? (
                         <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8" disabled><Loader2 className="h-5 w-5 animate-spin" /></Button>
                    ) : currentUser && (
                       <Link href={currentUserProfile?.username ? `/profile/${currentUserProfile.username}` : `/profile/edit`}>
                         <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
                              <Avatar className='h-8 w-8'>{currentUserProfile?.avatarUrl && <AvatarImage src={currentUserProfile.avatarUrl}/>}<AvatarFallback>{currentUserProfile?.name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                         </Button>
                       </Link>
                    )}
                </div>
            </header>
        )}
        
        <main className={cn("flex-1 w-full", isFullScreen ? "h-screen" : "h-full")}>
             {children}
        </main>

        {showNavs && (
            <nav className={cn("fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/70 backdrop-blur-sm transition-transform duration-300 md:hidden", "h-[var(--bottom-nav-height)]", isScrolling && "translate-y-full")}>
                <div className="grid h-full grid-cols-5">
                    <NavButton href="/explore" icon={<Home />} srText="Ana Sayfa" isActive={pathname === '/explore'} />
                    <NavButton href="/kesfet" icon={<Globe />} srText="Keşfet" isActive={pathname === '/kesfet'} />
                     <Link href="/create-post" className="flex items-center justify-center -mt-4">
                        <div className="bg-primary text-primary-foreground rounded-full h-14 w-14 flex items-center justify-center shadow-lg border-4 border-background">
                            <Plus className="h-7 w-7" strokeWidth={2.5}/>
                        </div>
                    </Link>
                    <NavButton href="/shuffle" icon={<Shuffle />} srText="Eşleş" isActive={pathname === '/shuffle'} />
                    <NavButton href={currentUserProfile?.username ? `/profile/${currentUserProfile.username}` : '/profile/edit'} icon={<User />} srText="Profil" isActive={pathname.startsWith('/profile')} />
                </div>
            </nav>
        )}
        </div>
    </>
  );
}


export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    )
}
