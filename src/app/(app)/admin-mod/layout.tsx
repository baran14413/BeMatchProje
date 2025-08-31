
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Home, LogOut, MessageSquareWarning, Search, ShieldHalf } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


const NavItem = ({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <SidebarMenuItem>
            <Link href={href}>
                <SidebarMenuButton isActive={isActive} className="w-full justify-start gap-3">
                    {icon}
                    <span className="truncate">{label}</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
    );
};

export default function AdminModLayout({ children }: { children: React.ReactNode }) {
    const user = auth.currentUser;
    const pathname = usePathname();

    const getPageTitle = () => {
        if (pathname === '/admin-mod') return 'Moderatör Paneli';
        if (pathname === '/admin-mod/reported-content') return 'Şikayet Yönetimi';
        return 'Panel';
    }

    return (
        <SidebarProvider>
            <Sidebar className='bg-background/80 backdrop-blur-sm'>
                <SidebarHeader className="p-4">
                     <Link href="/admin-mod" className="flex items-center gap-2 text-lg font-semibold">
                        <ShieldHalf className="h-7 w-7 text-primary" />
                        <span className="font-bold text-foreground">Mod Paneli</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <SidebarMenu>
                       <NavItem href="/admin-mod" icon={<Home />} label="Ana Sayfa" />
                       <NavItem href="/admin-mod/reported-content" icon={<MessageSquareWarning />} label="Şikayet Yönetimi" />
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="p-4 border-t">
                     <Link href="/explore">
                        <Button variant="ghost" className="w-full justify-start gap-3">
                            <LogOut className="w-5 h-5"/>
                            <span>Paneleden Çık</span>
                        </Button>
                    </Link>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                 <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-bold font-headline">{getPageTitle()}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                            type="search"
                            placeholder="Kullanıcı, gönderi ara..."
                            className="w-full rounded-full bg-muted pl-8"
                            />
                        </div>
                        {user?.photoURL && (
                            <Avatar className="w-9 h-9">
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback>{user.displayName?.charAt(0) ?? 'M'}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/40">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
