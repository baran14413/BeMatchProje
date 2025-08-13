'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Home, MessageCircle, Shuffle, User, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/match', label: 'Eşleş', icon: Zap },
    { href: '/chat', label: 'Sohbet', icon: MessageCircle },
    { href: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Link href="/match" className="flex items-center gap-2">
            <Shuffle className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-foreground">BeWalk</h1>
        </Link>
        <Link href="/profile">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/40x40.png" alt="@canyilmaz" data-ai-hint="man portrait"/>
              <AvatarFallback>CY</AvatarFallback>
            </Avatar>
        </Link>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 border-t bg-background/95 backdrop-blur-sm md:hidden">
          <div className="grid h-full grid-cols-3">
              {menuItems.map((item) => (
                  <Link 
                      key={item.href} 
                      href={item.href}
                      className={cn(
                          "flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:text-primary",
                          pathname === item.href && "text-primary"
                      )}
                  >
                      <div className={cn(
                          "p-3 rounded-full transition-colors",
                          pathname === item.href && "bg-primary/10"
                      )}>
                          <item.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium">{item.label}</span>
                  </Link>
              ))}
          </div>
      </nav>
       <nav className="hidden md:flex fixed left-0 h-screen w-20 flex-col items-center justify-between border-r py-6 bg-background">
          <Link href="/match" className="flex items-center justify-center">
             <Shuffle className="w-8 h-8 text-primary" />
          </Link>
           <div className="flex flex-col items-center gap-4">
               {menuItems.map((item) => (
                  <Link 
                      key={item.href} 
                      href={item.href}
                      className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-accent",
                          pathname === item.href && "bg-primary/10 text-primary"
                      )}
                  >
                      <item.icon className="h-6 w-6" />
                      <span className="sr-only">{item.label}</span>
                  </Link>
              ))}
           </div>
           <Link href="/profile">
             <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" alt="@canyilmaz" data-ai-hint="man portrait"/>
                <AvatarFallback>CY</AvatarFallback>
             </Avatar>
           </Link>
      </nav>
      <div className="md:pl-20">
        {children}
      </div>
    </div>
  );
}