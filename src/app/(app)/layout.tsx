
'use client';

import React, { type ReactNode, useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search, Shuffle, Bell, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { NetworkStatusBanner } from '@/components/ui/network-status-banner';
import { auth, db } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';


const NavButton = ({ href, icon, srText, hasNotification = false }: { href: string, icon: React.ReactNode, srText: string, hasNotification?: boolean }) => {
    return (
        <Link href={href}>
            <Button variant="ghost" size="icon" className="relative rounded-full">
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
  const currentPathname = usePathname();
  const searchParams = useSearchParams();
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isOnline, isPoorConnection } = useNetworkStatus();
  
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{username?: string} | null>(null);

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        setAuthStatus('authenticated');
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUserProfile(userDocSnap.data());
        }
      } else {
        setCurrentUserProfile(null);
        setAuthStatus('unauthenticated');
      }
    });
    return () => unsubscribeAuth();
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
            // A message is unread if it exists, it's not from the current user,
            // and the current user's UID is not in the readBy array.
            if (data.lastMessage && data.lastMessage.senderId !== currentUser.uid && !data.lastMessage.readBy?.includes(currentUser.uid)) {
                unreadFound = true;
                break; // Found one, no need to check further
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


  // A chat view is considered open if we are on the /chat page AND a specific userId/conversationId is in the query params.
  const isChatPage = currentPathname === '/chat';
  const isChatViewOpen = isChatPage && (searchParams.has('userId') || searchParams.has('conversationId'));
  const isCreatePage = currentPathname === '/create';
  
  // Show navs unless it's the create page or a specific chat is open.
  const showNavs = !isCreatePage && (!isChatPage || (isChatPage && !isChatViewOpen));
  const isFullScreen = isChatPage && isChatViewOpen;

  useEffect(() => {
    const handleScroll = () => {
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
  }, [showNavs]);


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
                !isOnline || isPoorConnection ? 'top-10' : 'top-0', // Adjust header position based on banner
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
                    {authStatus === 'authenticated' ? (
                        currentUserProfile?.username ? (
                             <Link href={`/profile/${currentUserProfile.username}`}>
                                <Button variant="ghost" size="icon" className="relative rounded-full">
                                    <User className="h-5 w-5" />
                                    <span className="sr-only">Profil</span>
                                </Button>
                            </Link>
                        ) : (
                             <Button variant="ghost" size="icon" className="relative rounded-full" disabled>
                                <Loader2 className="h-5 w-5 animate-spin" />
                             </Button>
                        )
                    ) : null}
                </div>
            </header>
          </>
        )}
        
        <main className={cn("flex-1 w-full", isFullScreen ? "h-screen" : "h-full")}>
            <Suspense fallback={<div>BeMatch Yükleniyor...</div>}>
                {children}
            </Suspense>
        </main>

        {showNavs && !isFullScreen && (
            <nav className={cn(
                "fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/80 backdrop-blur-sm transition-transform duration-300 md:hidden",
                "h-[var(--bottom-nav-height)]",
                isScrolling && "translate-y-full"
            )}>
                <div className="grid h-full grid-cols-3">
                    <Link href="/shuffle" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', currentPathname === '/shuffle' ? 'text-primary' : '')}>
                        <Shuffle className={cn('h-6 w-6')} />
                    </Link>
                    <Link href="/match" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', currentPathname === '/match' ? 'text-primary' : '')}>
                        <Home className={cn('h-6 w-6')} />
                    </Link>
                    <Link href="/explore" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', currentPathname === '/explore' ? 'text-primary' : '')}>
                        <Globe className={cn('h-6 w-6')} />
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
