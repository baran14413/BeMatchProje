'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Shuffle, User, Zap, Home, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/match', label: 'Eşleş', icon: Shuffle },
    { href: '/chat', label: 'Sohbet', icon: MessageCircle },
    { href: '/profile', label: 'Profil', icon: User },
  ];
  
  const mobileMenuItems = [
    { href: '/match', label: 'Eşleş', icon: Shuffle },
    { href: '/', label: 'Ana Sayfa', icon: Home },
    { href: '/chat', label: 'Sohbet', icon: MessageCircle },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Link href="/match" className="flex items-center gap-2">
          <Shuffle className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">BeWalk</h1>
        </Link>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Bildirimler</span>
            </Button>
            <Link href="/profile">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/40x40.png" alt="@canyilmaz" data-ai-hint="man portrait"/>
                <AvatarFallback>CY</AvatarFallback>
              </Avatar>
            </Link>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden md:fixed md:left-0 md:top-16 md:flex md:h-[calc(100vh-4rem)] md:w-20 md:flex-col md:items-center md:justify-center md:border-r md:py-6 md:bg-background">
          <div className="flex flex-col items-center gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-accent',
                  pathname === item.href && 'bg-primary/10 text-primary'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="sr-only">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <main className="flex-1 w-full md:pl-20 pb-20 md:pb-0">
            {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 border-t bg-background/95 backdrop-blur-sm md:hidden">
        <div className="grid h-full grid-cols-3">
          {mobileMenuItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/match' : pathname === item.href;
            const targetHref = item.href === '/' ? '/match' : item.href;

            return (
              <Link
                key={item.href}
                href={targetHref}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                   (pathname === '/match' && item.label === 'Ana Sayfa') || (pathname === item.href && item.label !== 'Ana Sayfa') ? 'text-primary' : ''
                )}
              >
                <div
                  className={cn(
                    'p-3 rounded-full transition-colors',
                    (pathname === '/match' && item.label === 'Ana Sayfa') || (pathname === item.href && item.label !== 'Ana Sayfa') ? 'bg-primary/10' : ''
                  )}
                >
                  <item.icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  );
}
