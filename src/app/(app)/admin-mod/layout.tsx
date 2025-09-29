
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogOut, MessageSquareWarning, Search, ShieldHalf } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from '@/components/ui/sidebar';

export default function AdminModLayout({ children }: { children: React.ReactNode }) {
    const user = auth.currentUser;
    const pathname = usePathname();

    const modNavItems = [
      { href: '/admin-mod', icon: <Home />, label: 'Genel Bakış' },
      { href: '/admin-mod/reported-content', icon: <MessageSquareWarning />, label: 'Şikayet Yönetimi' },
    ];


    return (
      <SidebarProvider>
        <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarHeader>
                <Link href="/admin-mod" className="flex items-center gap-2 text-lg font-semibold px-2">
                    <ShieldHalf className="h-7 w-7 text-primary" />
                    <span className="font-bold text-foreground">Mod Paneli</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                     {modNavItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild isActive={pathname === item.href}>
                                <Link href={item.href}>
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>

        <SidebarInset>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
                <div className="relative flex-1 md:grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Ara..."
                        className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]"
                    />
                </div>
                <div className='ml-auto flex items-center gap-2'>
                    <Link href="/explore">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">Panelden Çık</span>
                        </Button>
                    </Link>
                    {user?.photoURL && (
                        <Avatar className="w-9 h-9">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback>{user.displayName?.charAt(0) ?? 'M'}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-8 sm:py-6">
                {children}
            </main>
        </SidebarInset>
      </SidebarProvider>
    );
}
