
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search, Shuffle, Bell, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';

// Pass children to determine if the chat view is open
function isChatViewOpen(children: ReactNode): boolean {
  if (React.isValidElement(children) && children.props) {
    const pageProps = children.props.childProp?.segment === 'chat' ? children.props.childProp.parallelRoutes.children.props.childProp.segment.__PAGE__ : null;
    if (pageProps) {
        return pageProps.activeChat !== null;
    }
  }
  return false;
}


export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const isCreatePage = pathname === '/create';
  
  // This is a bit of a hack to check if the chat detail view is open on mobile
  // A better solution would involve a global state manager (like Zustand or Context)
  const chatViewOpen = isChatViewOpen(children);
  const isMobileChatView = pathname === '/chat' && chatViewOpen;


  // This will hide navbars on scroll down and show on scroll up
  const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) { // Scrolling down
          setIsVisible(false);
      } else { // Scrolling up
          setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Determine if navs should be shown based on page and scroll direction
  const showNavs = isVisible && !isCreatePage && !isMobileChatView;


  if (isCreatePage) {
    return <main className="flex-1 w-full">{children}</main>;
  }
  
  const headerHeight = 'h-16';
  const bottomNavHeight = 'h-16';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-4 border-b shrink-0 bg-background/95 backdrop-blur-sm md:px-6 transition-transform duration-300",
        headerHeight,
        !showNavs && "-translate-y-full"
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
      
      <main className={cn(
        "flex-1 w-full",
        // This is a trick to make the main content area fill the space between the header and bottom nav
        // It's not perfect and might need adjustment based on your specific layout needs
        // The CSS variables are set here and used in chat/page.tsx
        `h-[calc(100vh_-_var(--header-height)_-_var(--bottom-nav-height))]`
      )}
       style={{
        // @ts-ignore
        '--header-height': showNavs ? '4rem' : '0rem', 
        '--bottom-nav-height': showNavs ? '4rem' : '0rem',
      }}
      >
          {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-t md:hidden transition-transform duration-300",
        bottomNavHeight,
        !showNavs && "translate-y-full"
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
