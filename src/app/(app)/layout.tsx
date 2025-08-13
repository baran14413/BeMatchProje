
'use client';

import React, { type ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search, Shuffle, Bell, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Helper function to check if the chat view is open by inspecting React props.
// This is a bit of a hack and might break with future Next.js updates.
// A more robust solution would involve a global state manager (e.g., Zustand, Redux).
function isChatViewOpen(children: ReactNode): boolean {
  if (React.isValidElement(children) && (children.props as any)) {
    try {
      const pageProps = (children.props as any).childProp.parallelRoutes.children.props.childProp.segment.__PAGE__.props;
      // The `activeChat` prop is specific to our ChatPage component
      if ('activeChat' in pageProps && pageProps.activeChat !== null) {
        return true;
      }
    } catch (e) {
      // It's normal for this to fail on other pages, so we ignore the error.
      return false;
    }
  }
  return false;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const isCreatePage = pathname === '/create';
  const isChatPage = pathname.startsWith('/chat');
  
  // This is the check to see if a specific chat is open on mobile
  const chatViewOpen = isChatPage && isChatViewOpen(children);

  const showNavs = !isCreatePage && !isChatPage;

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      const currentScrollY = window.scrollY;
      // Hide immediately on scroll down
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsScrolledDown(true);
      } else if (currentScrollY < lastScrollY.current) {
         // Show only when scrolling stops
         scrollTimeout.current = setTimeout(() => {
           setIsScrolledDown(false);
         }, 150);
      }
      lastScrollY.current = currentScrollY;
    };

    if (showNavs) {
       window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
        setIsScrolledDown(false); // Reset on pages where navs are hidden
    }
   
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [showNavs]);


  const headerHeight = 'h-16';
  const bottomNavHeight = 'h-16';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-4 border-b shrink-0 bg-background/95 backdrop-blur-sm md:px-6 transition-transform duration-300",
        headerHeight,
        !showNavs && "hidden",
        isScrolledDown && showNavs && "-translate-y-full"
       )}>
        <Link href="/match" className="flex items-center gap-2 font-semibold text-lg">
            <Heart className="w-7 h-7 text-primary" />
            <span className="font-bold">BeMatch</span>
        </Link>
        <div className="flex items-center gap-2">
            <Link href="/profile">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="w-5 h-5" />
                    <span className="sr-only">Profil</span>
                </Button>
            </Link>
             <Link href="/chat">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <MessageCircle className="w-5 h-5" />
                    <span className="sr-only">Mesajlar</span>
                </Button>
            </Link>
             <Link href="#">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Bell className="w-5 h-5" />
                    <span className="sr-only">Bildirimler</span>
                </Button>
            </Link>
            <Link href="#">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Search className="w-5 h-5" />
                    <span className="sr-only">Ara</span>
                </Button>
            </Link>
        </div>
      </header>
      
      <main className="flex-1 w-full">
          {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t md:hidden transition-transform duration-300",
        bottomNavHeight,
        !showNavs && "hidden",
        isScrolledDown && showNavs && "translate-y-full"
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
