
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LogOut, PanelLeft, Search, ShieldAlert, Users2, ShieldHalf, Users, CreditCard, MessageSquareWarning, Star, LineChart, Code, Ban, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminAuthPage from './auth/page';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { cn } from '@/lib/utils';


const FIVE_MINUTES = 5 * 60 * 1000;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = auth.currentUser;
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const authTimestampStr = sessionStorage.getItem('adminAuthTimestamp');
        if (authTimestampStr) {
            const authTimestamp = parseInt(authTimestampStr, 10);
            if (Date.now() - authTimestamp < FIVE_MINUTES) {
                setIsAuthenticated(true);
            }
        }
    }, []);

    const handleAuthentication = () => {
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuthTimestamp', Date.now().toString());
    };

    const adminNavItems = [
      { href: '/admin', icon: <Home />, label: 'Genel Bakış' },
      { href: '/admin/users', icon: <Users />, label: 'Kullanıcıları Yönet' },
      { href: '/admin/payment-confirmations', icon: <CreditCard />, label: 'Ödeme Onayları' },
      { href: '/admin/reported-content', icon: <MessageSquareWarning />, label: 'Raporlar' },
      { href: '/admin/feedback', icon: <Star />, label: 'Geri Bildirimler' },
      { href: '/admin/activity-logs', icon: <ShieldCheck />, label: 'Aktivite Kayıtları' },
      { href: '/admin/blocked-ips', icon: <Ban />, label: 'Engellenen IPler' },
      { href: '/admin/system-status', icon: <LineChart />, label: 'Sistem Durumu' },
      { href: '/admin/technologies', icon: <Code />, label: 'Teknolojilerimiz' },
    ];

    if (!isAuthenticated) {
        return <AdminAuthPage onAuthenticated={handleAuthentication} />;
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <Sidebar side="left" variant="sidebar" collapsible="icon">
                    <SidebarHeader>
                        <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold px-2">
                            <ShieldAlert className="h-7 w-7 text-primary" />
                            <span className="font-bold text-foreground">Admin</span>
                        </Link>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            {adminNavItems.map(item => (
                                <SidebarMenuItem key={item.href}>
                                     <SidebarMenuButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href}>
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                             <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/admin-mod">
                                        <ShieldHalf />
                                        <span>Mod Paneli</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
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
                        <div className="ml-auto flex items-center gap-2">
                             <Link href="/explore">
                                <Button variant="outline" size="icon" className="h-9 w-9">
                                    <LogOut className="h-4 w-4" />
                                    <span className="sr-only">Paneleden Çık</span>
                                </Button>
                            </Link>
                            {user?.photoURL && (
                                <Avatar className="w-9 h-9">
                                    <AvatarImage src={user.photoURL} />
                                    <AvatarFallback>{user.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </header>
                    <main className="flex flex-1 flex-col gap-4 p-4 sm:px-8 sm:py-6">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
