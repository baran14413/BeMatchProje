
'use client';

import React, { type ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search, Shuffle, Bell, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NavButton = ({ href, icon, srText, hasNotification = false }: { href: string, icon: React.ReactNode, srText: string, hasNotification?: boolean }) => {
    return (
        <Link href={href}>
            <Button variant="ghost" size="icon" className="rounded-full relative">
                {icon}
                {hasNotification && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                )}
                <span className="sr-only">{srText}</span>
            </Button>
        </Link>
    );
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // A chat view is considered open if we are on the /chat page AND a specific userId is in the query params.
  const isChatPage = pathname === '/chat';
  const isChatViewOpen = isChatPage && searchParams.has('userId');
  const isCreatePage = pathname === '/create';
  
  // Show navs unless it's the create page or a specific chat is open.
  const showNavs = !isCreatePage && !isChatViewOpen;

  // Mock state for notifications - in a real app this would come from a global state/context
  const hasUnreadMessages = true;
  const hasUnreadNotifications = true;

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
            className="flex flex-col min-h-screen bg-background text-foreground"
            style={{
                paddingTop: showNavs ? 'var(--header-height)' : '0',
                paddingBottom: showNavs ? 'var(--bottom-nav-height)' : '0',
            } as React.CSSProperties}
        >
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 transition-transform duration-300 bg-background/80 backdrop-blur-sm",
            "h-[var(--header-height)]",
            !showNavs && "hidden",
            isScrolling && showNavs && "-translate-y-full"
        )}>
            <Link href="/match" className="flex items-center gap-2 font-semibold text-lg">
                <Heart className="w-7 h-7 text-primary" />
                <span className="font-bold">BeMatch</span>
            </Link>
            <div className="flex items-center gap-2">
                <Link href="/profile/1"><Button variant="ghost" size="icon" className="rounded-full relative">
                    <User className="w-5 h-5" />
                    <span className="sr-only">Profil</span>
                </Button></Link>
                <NavButton href="/chat" icon={<MessageCircle className="w-5 h-5" />} srText="Mesajlar" hasNotification={hasUnreadMessages} />
                <NavButton href="/notifications" icon={<Bell className="w-5 h-5" />} srText="Bildirimler" hasNotification={hasUnreadNotifications} />
                <NavButton href="#" icon={<Search className="w-5 h-5" />} srText="Ara" />
            </div>
        </header>
        
        <main className="flex-1 w-full h-full">
            {children}
        </main>

        {/* Bottom Navigation for Mobile */}
        <nav className={cn(
            "fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm md:hidden transition-transform duration-300",
            "h-[var(--bottom-nav-height)] border-t border-border/50",
            !showNavs && "hidden",
            isScrolling && showNavs && "translate-y-full"
        )}>
            <div className="grid h-full grid-cols-3">
                <Link href="#" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary')}>
                    <Shuffle className={cn('w-6 h-6')} />
                </Link>
                <Link href="/match" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === '/match' ? 'text-primary' : '')}>
                    <Home className={cn('w-6 h-6')} />
                </Link>
                <Link href="/explore" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === '/explore' ? 'text-primary' : '')}>
                    <Globe className={cn('w-6 h-6')} />
                </Link>
            </div>
        </nav>
        </div>
  );
}
