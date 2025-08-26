
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
} from '@/components/ui/sidebar';
import { Home, Users, Settings, LogOut, PanelLeft, LineChart, Search, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = auth.currentUser;
    const pathname = usePathname();

    const getPageTitle = () => {
        if (pathname === '/admin') return 'Dashboard';
        if (pathname === '/admin/users') return 'Kullanıcılar';
        if (pathname === '/admin/activity-logs') return 'Aktivite Kayıtları';
        if (pathname === '/admin/settings') return 'Ayarlar';
        return 'Panel';
    }

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="p-4">
                     <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold">
                        <LineChart className="h-7 w-7 text-primary" />
                        <span className="font-bold text-foreground">Panel</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <SidebarMenu>
                       <NavItem href="/admin" icon={<Home />} label="Dashboard" />
                       <NavItem href="/admin/users" icon={<Users />} label="Kullanıcılar" />
                       <NavItem href="/admin/activity-logs" icon={<ShieldCheck />} label="Aktivite Kayıtları" />
                       <NavItem href="/admin/settings" icon={<Settings />} label="Ayarlar" />
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="p-4 border-t">
                     <Link href="/logout">
                        <Button variant="ghost" className="w-full justify-start gap-3">
                            <LogOut className="w-5 h-5"/>
                            <span>Çıkış Yap</span>
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
                            placeholder="Ara..."
                            className="w-full rounded-full bg-muted pl-8"
                            />
                        </div>
                        {user?.photoURL && (
                            <Avatar className="w-9 h-9">
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback>{user.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
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
