'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Map, Heart, MessageCircle, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

   const menuItems = [
    { href: '/match', label: 'Home', icon: Home },
    { href: '/hub', label: 'Hub', icon: LayoutGrid },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/likes', label: 'Beğeniler', icon: Heart },
    { href: '/chat', label: 'Chat', icon: MessageCircle, notification: 1 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div>
            {/* Intentionally left blank to match design */}
        </div>
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" className="rounded-full bg-card h-10 w-10 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
              <span className="sr-only">Bildirimler</span>
            </Button>
            <Link href="/profile">
              <Avatar className="h-10 w-10 border-2 border-primary/50">
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-24 border-t bg-background/95 backdrop-blur-sm md:hidden">
        <div className="grid h-full grid-cols-5">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:text-primary pt-2',
                  isActive ? 'text-primary font-semibold' : ''
                )}
              >
                <div className="relative">
                    <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                    {item.notification && (
                       <Badge className="absolute -top-2 -right-3 h-5 w-5 justify-center p-0">{item.notification}</Badge>
                    )}
                </div>

                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  );
}
