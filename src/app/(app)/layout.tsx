
'use client';

import React, { type ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search, Shuffle, Bell, Globe, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Helper to determine if a specific chat is open on mobile
function isChatViewOpen(children: ReactNode): boolean {
  if (React.isValidElement(children) && (children.props as any)) {
    try {
      const pageProps = (children.props as any)?.childProp?.parallelRoutes?.children?.props?.childProp?.segment === '__PAGE__'
        ? (children.props as any).childProp.parallelRoutes.children.props.childProp.segment.__PAGE__.props
        : null;

      if (pageProps?.activeChat) {
          return true
      }
    } catch (e) {
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

  const isChatPage = pathname.startsWith('/chat');
  const isCreatePage = pathname === '/create';
  
  // This is the check to see if a specific chat is open on mobile
  const chatViewOpen = isChatPage && isChatViewOpen(children);

  // Navs should be hidden on the create page or when a specific chat is open on mobile.
  const showNavs = !isChatPage && !isCreatePage;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsScrolledDown(true);
      } 
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        setIsScrolledDown(false);
      }, 150);


      lastScrollY.current = currentScrollY;
    };

    if (showNavs) {
       window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
        setIsScrolledDown(false);
    }
   
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [showNavs]);


  return (
    <div 
        className="flex flex-col min-h-screen bg-background text-foreground"
        style={{
            paddingTop: 'var(--header-height)',
            paddingBottom: 'var(--bottom-nav-height)',
        } as React.CSSProperties}
    >
       <header className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm md:px-6 transition-transform duration-300",
        "h-[var(--header-height)]",
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
        "fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm md:hidden transition-transform duration-300",
        "h-[var(--bottom-nav-height)]",
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
