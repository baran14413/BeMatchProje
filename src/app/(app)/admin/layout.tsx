
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { Home, Users, Settings, LogOut, PanelLeft, LineChart, Search, ShieldCheck, Ban, ShieldAlert, FileWarning, MessageSquareWarning, Star, Users2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import AdminAuthPage from './auth/page';

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
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

     useEffect(() => {
        const adminAuth = sessionStorage.getItem('admin-authenticated');
        if (adminAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const getPageTitle = () => {
        if (pathname === '/admin') return 'Yönetim Paneli';
        if (pathname === '/admin/users') return 'Kullanıcılar';
        if (pathname === '/admin/activity-logs') return 'Aktivite Kayıtları';
        if (pathname === '/admin/blocked-ips') return 'Engellenen IP\'ler';
        if (pathname === '/admin/reported-content') return 'Rapor Edilen İçerikler';
        if (pathname === '/admin/system-status') return 'Sistem Durumu';
        if (pathname === '/admin/feedback') return 'Geri Bildirimler';
        return 'Panel';
    }

    if (!isAuthenticated) {
        return <AdminAuthPage onAuthenticated={() => setIsAuthenticated(true)} />;
    }

    return (
        <SidebarProvider>
            <Sidebar className='bg-background/80 backdrop-blur-sm'>
                <SidebarHeader className="p-4">
                     <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold">
                        <ShieldAlert className="h-7 w-7 text-primary" />
                        <span className="font-bold text-foreground">Admin Paneli</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <SidebarMenu>
                       <NavItem href="/admin" icon={<Home />} label="Ana Sayfa" />
                       <NavItem href="/admin/users" icon={<Users />} label="Kullanıcı Yönetimi" />
                       <NavItem href="/admin/system-status" icon={<LineChart />} label="Sistem Durumu" />
                        <SidebarSeparator />
                       <NavItem href="/admin/reported-content" icon={<MessageSquareWarning />} label="Rapor Edilenler" />
                       <NavItem href="/admin/feedback" icon={<Star />} label="Geri Bildirimler" />
                       <SidebarSeparator />
                       <NavItem href="/admin/activity-logs" icon={<ShieldCheck />} label="Aktivite Kayıtları" />
                       <NavItem href="/admin/blocked-ips" icon={<Ban />} label="Engellenen IP'ler" />
                       <SidebarSeparator />
                        <NavItem href="/admin-mod" icon={<Users2 />} label="Moderatör Paneli" />
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
