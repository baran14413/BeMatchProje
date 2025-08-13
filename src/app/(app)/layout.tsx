
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Heart, Search, Shuffle, Bell, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function isChatViewOpen(children: ReactNode): boolean {
  if (React.isValidElement(children) && children.props) {
    // This is a hacky way to check props of a page from the layout in Next.js App Router.
    // It's brittle and might break with Next.js updates.
    // A more robust solution would involve using a global state manager (like Zustand or Jotai)
    // to share state between the page and the layout.
    try {
      const pageProps = children.props.childProp?.parallelRoutes.children.props.childProp.segment === 'chat'
        ? children.props.childProp.parallelRoutes.children.props.childProp.segment['__PAGE__']?.props
        : null;

      if (pageProps && 'activeChat' in pageProps) {
        return pageProps.activeChat !== null;
      }
    } catch (e) {
      // This can fail if the prop structure changes, so we'll just assume the chat isn't open.
      return false;
    }
  }
  return false;
}


export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isCreatePage = pathname === '/create';
  
  // This is a bit of a hack to check if the chat detail view is open on mobile
  // A better solution would involve a global state manager (like Zustand or Context)
  const chatViewOpen = isChatViewOpen(children);

  const showNavs = !isCreatePage && !(pathname === '/chat' && chatViewOpen);
  
  const headerHeight = 'h-16';
  const bottomNavHeight = 'h-16';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-4 border-b shrink-0 bg-background/95 backdrop-blur-sm md:px-6 transition-transform duration-300",
        headerHeight,
        !showNavs && "hidden" // Use hidden instead of transform for simplicity
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
        "fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t md:hidden",
        bottomNavHeight,
        !showNavs && "hidden"
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
