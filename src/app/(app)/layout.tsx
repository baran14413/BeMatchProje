'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Shuffle, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/match', label: 'Rastgele', icon: Shuffle },
    { href: '/chat', label: 'Mesajlar', icon: MessageCircle, notification: 1 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background/95 backdrop-blur-sm md:px-6">
        <Link href="/match" className="flex items-center gap-2 font-semibold">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
               {/* Using a simple heart icon for the logo now */}
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>
            <span className="text-xl font-bold font-headline text-primary">BeMatch</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="w-5 h-5" />
            <span className="sr-only">Bildirimler</span>
          </Button>
          <Link href="/profile">
            <Avatar className="w-9 h-9">
              <AvatarImage src="https://placehold.co/40x40.png" alt="@canyilmaz" data-ai-hint="man portrait"/>
              <AvatarFallback>CY</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 w-full pb-16 md:pb-0">
          {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background/95 backdrop-blur-sm md:hidden">
        <div className="grid h-full grid-cols-3">
            <Link href="/match" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === '/match' ? 'text-primary' : '')}>
                <Shuffle className={cn('w-5 h-5')} />
            </Link>
            <Link href="/match" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname === '/match' ? 'text-primary' : '')}>
                <div className={cn('flex items-center justify-center w-12 h-12 rounded-full transition-all', pathname === '/match' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    <Home className="w-6 h-6" />
                </div>
            </Link>
             <Link href="/chat" className={cn('flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary', pathname.startsWith('/chat') ? 'text-primary' : '')}>
                <div className="relative">
                    <MessageCircle className={cn('w-5 h-5')} />
                    {/* Notification dot */}
                    <span className="absolute -top-0.5 -right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                </div>
            </Link>
        </div>
      </nav>
    </div>
  );
}
