'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Hide bars on scroll
      setIsVisible(false);

      // Clear the previous timeout if it exists
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set a new timeout to show the bars after scrolling has stopped
      scrollTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 250); // Adjust timeout as needed (250ms is a good starting point)
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className={cn(
        "sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background/95 backdrop-blur-sm md:px-6 transition-transform duration-300",
        !isVisible && "-translate-y-full"
       )}>
        <Link href="/match" className="flex items-center gap-2 font-semibold">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
            <span className="text-xl font-bold font-headline text-primary">BeMatch</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/chat">
            <Button variant="ghost" size="icon" className="rounded-full">
              <MessageCircle className="w-5 h-5" />
              <span className="sr-only">Mesajlar</span>
            </Button>
          </Link>
          <Link href="/profile">
             <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
                <span className="sr-only">Profil</span>
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 w-full">
          {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background/95 backdrop-blur-sm md:hidden transition-transform duration-300",
        !isVisible && "translate-y-full"
      )}>
        <div className="grid h-full grid-cols-4">
            <Link href="#" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary')}>
                <Search className={cn('w-6 h-6')} />
            </Link>
            <Link href="/match" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === '/match' ? 'text-primary' : '')}>
                <Home className={cn('w-6 h-6')} />
            </Link>
             <Link href="#" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary')}>
                <Heart className={cn('w-6 h-6')} />
            </Link>
            <Link href="/chat" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname.startsWith('/chat') ? 'text-primary' : '')}>
                <MessageCircle className={cn('w-6 h-6')} />
            </Link>
        </div>
      </nav>
    </div>
  );
}
