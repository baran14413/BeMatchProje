'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageCircle, User, LogOut } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/match', label: 'Eşleş', icon: Heart },
    { href: '/chat', label: 'Sohbet', icon: MessageCircle },
    { href: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Heart className="w-8 h-8 text-primary-foreground" />
              <h1 className="text-2xl font-bold font-headline text-primary-foreground">BeMatch</h1>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors">
                <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="@kullanici" data-ai-hint="person" />
                    <AvatarFallback>CY</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="text-sm font-medium text-sidebar-foreground">Can Yılmaz</p>
                    <p className="text-xs text-sidebar-foreground/70">can@yilmaz.com</p>
                </div>
                <Link href="/" passHref>
                    <LogOut className="w-5 h-5 text-sidebar-foreground/70 hover:text-sidebar-foreground" />
                </Link>
             </div>
          </SidebarFooter>
        </div>
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
