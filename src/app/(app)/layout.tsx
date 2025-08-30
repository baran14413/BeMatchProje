
'use client';

import React, { type ReactNode, useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search, Shuffle, Bell, Globe, Loader2, LogOut, Settings, Sparkles, X } from 'lucide-react';
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

const NavButton = ({ href, icon, srText, isActive, hasNotification = false }: { href: string, icon: React.ReactNode, srText: string, isActive: boolean, hasNotification?: boolean }) => {
    return (
        <Link href={href} className="flex flex-col items-center justify-center gap-1 w-full h-full relative">
            <motion.div whileTap={{ scale: 0.9 }} className="relative flex flex-col items-center justify-center">
                 {React.cloneElement(icon as React.ReactElement, {
                    className: cn('h-7 w-7 transition-all', isActive ? 'text-primary' : 'text-muted-foreground'),
                    strokeWidth: 2.5
                })}
                 <span className={cn("text-xs transition-colors", isActive ? 'text-primary font-bold' : 'text-foreground')}>
                    {srText}
                </span>
                {hasNotification && (
                    <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full border-2 border-background bg-red-500 animate-pulse-heart" />
                )}
            </motion.div>
        </Link>
    );
};

const HeartExplosion = ({ isExploding }: { isExploding: boolean }) => {
    const colors = ['#ff6b6b', '#f94d6a', '#f06595', '#a26af7', '#7048e8', '#4263eb'];
    const hearts = Array.from({ length: 30 }); // Create 30 hearts

    return (
        <AnimatePresence>
            {isExploding && (
                <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
                    {hearts.map((_, i) => {
                        const randomXStart = Math.random() * 100; // vw
                        const randomXEnd = randomXStart + (Math.random() - 0.5) * 50;
                        const randomDuration = 2 + Math.random() * 2;
                        const randomDelay = Math.random() * 1;
                        const randomScale = 0.5 + Math.random();
                        const randomColor = colors[i % colors.length];

                        return (
                            <motion.div
                                key={i}
                                initial={{ x: `${randomXStart}vw`, y: '110vh', opacity: 1, scale: randomScale }}
                                animate={{
                                    x: `${randomXEnd}vw`,
                                    y: '-10vh',
                                    opacity: 0,
                                }}
                                transition={{
                                    duration: randomDuration,
                                    delay: randomDelay,
                                    ease: "easeOut",
                                }}
                                className="absolute"
                                style={{ color: randomColor }}
                            >
                                <Heart className="w-8 h-8" fill="currentColor" />
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </AnimatePresence>
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
  const [showNotification, setShowNotification] = useState(false);
  const activityLoggedRef = useRef(false);
  const lastShownNotificationIdRef = useRef<string | null>(null);
  
  const [isClientReady, setIsClientReady] = useState(false);

  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [isExploding, setIsExploding] = useState(false);

   useEffect(() => {
    const lockConfig = localStorage.getItem('app-lock-config');
    if (lockConfig) {
      const { isEnabled } = JSON.parse(lockConfig);
      setIsLocked(isEnabled);
    } else {
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    setIsClientReady(true);
    const storedPreference = localStorage.getItem('disableAnimations');
    setAnimationsDisabled(storedPreference === 'true');
  }, []);

  const getPageTitle = useCallback(() => {
    if (!isClientReady) return "BeMatch";
    if (pathname === '/kesfet') return 'Keşif';
    if (pathname === '/explore') return 'Ana Akış';
    if (pathname.startsWith('/profile/')) return 'Profil';
    if (pathname === '/notifications') return 'Bildirimler';
    if (pathname === '/chat') return 'Sohbetler';
    if (pathname.startsWith('/random-chat')) return 'Rastgele Sohbet';
    if (pathname === '/search') return 'Ara';
    if (pathname === '/match') return 'Eşleşme';
    return "BeMatch";
  }, [pathname, isClientReady]);
  

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        setupPresence(user.uid);
        if (!currentUserProfile || currentUser?.uid !== user.uid) {
            setLoadingProfile(true);
            try {
              const userDocRef = doc(db, "users", user.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const profileData = userDocSnap.data();
                setCurrentUserProfile(profileData);
                if (!sessionStorage.getItem('welcomeMessageShown')) {
                    const welcomeText = `Hoş geldin, ${profileData.name?.split(' ')[0]}! ❤️`;
                    setLastNotification({ id: 'welcome-message', text: welcomeText });
                    setShowNotification(true);
                    setTimeout(() => setShowNotification(false), 6000);
                    sessionStorage.setItem('welcomeMessageShown', 'true');
                }
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
        setLastNotification(null);
        return;
    };

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsubscribeNotifications = onSnapshot(notificationsQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const newNotifDoc = snapshot.docs[0];
        const newNotif = newNotifDoc.data();
        const newNotifId = newNotifDoc.id;

        if (newNotifId !== lastShownNotificationIdRef.current) {
          const text = newNotif.type === 'like' 
            ? `**${newNotif.fromUser.name}** bir gönderini beğendi.`
            : newNotif.type === 'follow' 
            ? `**${newNotif.fromUser.name}** seni takip etmeye başladı.`
            : `**${newNotif.fromUser.name}** gönderine yorum yaptı.`;
          
          setLastNotification({ id: newNotifId, text });
          setShowNotification(true);
          lastShownNotificationIdRef.current = newNotifId;

          // Mark as read after showing
          const notifRef = doc(db, 'notifications', newNotifId);
          await updateDoc(notifRef, { read: true });

          setTimeout(() => {
            setShowNotification(false);
          }, 4000);
        }
      }
    }, (error) => {
        console.error("Error fetching notification status:", error);
    });
    
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
  const isRandomChatPage = pathname.startsWith('/random-chat');
  const isCreatePage = pathname === '/create';
  const isAdminPage = isClientReady && pathname.startsWith('/admin');
  const showNavs = isClientReady && !isCreatePage && (!isChatPage || (isChatPage && !isChatViewOpen)) && !isAdminPage && !isRandomChatPage;
  const isFullScreen = isClientReady && ((isChatPage && isChatViewOpen) || isAdminPage || isRandomChatPage);

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
  
  const handleLogoClick = () => {
      setIsExploding(true);
      setTimeout(() => setIsExploding(false), 4000);
  };

  const pageTitle = getPageTitle();

  if (isLocked === null) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      );
  }
  if (isLocked) {
      return <AppLockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <>
        <HeartExplosion isExploding={isExploding} />
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
              <div className="flex items-center gap-2 text-lg font-semibold overflow-hidden">
                  <AnimatePresence initial={false}>
                      {showNotification && lastNotification ? (
                          <motion.div
                              key="notification"
                              initial={{ x: "-100%", opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              exit={{ x: "-100%", opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              className="flex items-center gap-2"
                          >
                            <Bell className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium whitespace-nowrap" dangerouslySetInnerHTML={{ __html: lastNotification.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </motion.div>
                      ) : (
                           <motion.div
                              key="title"
                              initial={{ x: "-100%", opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              exit={{ x: "-100%", opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              className="flex items-center gap-2"
                          >
                            <div className='w-9 h-9 cursor-pointer' onClick={handleLogoClick}>
                                <span className='text-3xl animate-pulse-heart-sm inline-block bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent'>❤️</span>
                            </div>
                            <span className="font-bold">{pageTitle}</span>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8" asChild>
                        <Link href="/search"><Search className="h-5 w-5" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8" asChild>
                        <Link href="/notifications"><Bell className="h-5 w-5" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8" asChild>
                       <Link href="/chat">
                         <MessageCircle className="h-5 w-5" />
                         {hasUnreadMessages && (
                            <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full border-2 border-background bg-red-500 animate-pulse-heart" />
                        )}
                       </Link>
                    </Button>
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
        
        <main className={cn("flex-1 w-full", isFullScreen ? "h-screen" : "h-full")}>
             {children}
        </main>

        {showNavs && !isFullScreen && (
            <nav className={cn(
                "fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/80 backdrop-blur-sm transition-transform duration-300 md:hidden",
                "h-[var(--bottom-nav-height)]",
                isScrolling && "translate-y-full"
            )}>
                <div className="grid h-full grid-cols-4">
                    <NavButton href="/explore" icon={<Globe />} srText="Akış" isActive={pathname === '/explore'} />
                    <NavButton href="/kesfet" icon={<Sparkles />} srText="Keşif" isActive={pathname === '/kesfet'} />
                    <NavButton href="/chat" icon={<MessageCircle />} srText="Sohbet" isActive={pathname.startsWith('/chat')} hasNotification={hasUnreadMessages}/>
                    <NavButton href={`/profile/${currentUserProfile?.username ?? ''}`} icon={<User />} srText="Profil" isActive={pathname.startsWith('/profile')} />
                </div>
            </nav>
        )}
        </div>
    </>
  );
}


export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    )
}
