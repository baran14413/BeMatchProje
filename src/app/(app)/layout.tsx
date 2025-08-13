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
    { href: '/match', label: 'Ana Sayfa', icon: Home },
    { href: '/chat', label: 'Mesajlar', icon: MessageCircle, notification: 1 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background/95 backdrop-blur-sm md:px-6">
        <Link href="/match" className="flex items-center gap-2 font-semibold">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary">
               <Image src="/logo.svg" alt="BeWalk Logo" width={20} height={20} className="invert" />
            </div>
            <span className="text-xl font-bold font-headline">BeWalk</span>
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
      
      <main className="flex-1 w-full overflow-y-auto">
          {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 border-t bg-background/95 backdrop-blur-sm md:hidden">
        <div className="grid h-full grid-cols-3">
          {menuItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href) && (item.href !== '/match' || pathname === '/match' || (index === 0 && pathname !== '/chat'));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                  isActive ? 'text-primary' : '',
                  index === 1 ? 'relative' : '' 
                )}
              >
                {index === 1 && (
                  <div className="absolute flex items-center justify-center w-16 h-16 transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 border-4 rounded-full shadow-lg bg-background border-background left-1/2 top-1/2">
                     <div className={cn(
                       "flex items-center justify-center w-full h-full rounded-full bg-primary text-primary-foreground",
                       isActive ? "scale-110" : ""
                     )}>
                        <item.icon className="w-7 h-7" strokeWidth={2.5} />
                     </div>
                  </div>
                )}
                
                {index !== 1 && (
                    <div className="relative">
                        <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                         {item.notification && (
                            <span className="absolute -top-1 -right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                         )}
                    </div>
                )}

                <span className={cn(
                    "text-xs mt-1",
                     index === 1 ? 'absolute bottom-1.5' : ''
                )}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  );
}
