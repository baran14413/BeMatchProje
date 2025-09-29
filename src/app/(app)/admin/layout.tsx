
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';


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

    const SidebarNavigation = () => (
        <div className="flex h-full flex-col">
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
        </div>
    );

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <div className="hidden border-r bg-muted/40 md:block">
            <SidebarNavigation />
          </div>
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                  >
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                  <SidebarNavigation />
                </SheetContent>
              </Sheet>
              <div className="w-full flex-1">
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Ara..."
                        className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                    />
                </div>
              </div>
              <div className="flex items-center gap-2">
                    <Link href="/explore">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">Panelden Çık</span>
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
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
          </div>
        </div>
    );
}
