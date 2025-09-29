
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LogOut, PanelLeft, Search, ShieldAlert, Users, CreditCard, MessageSquareWarning, Star, LineChart, Code, Ban, ShieldCheck, ShieldHalf, Bot, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth, db } from '@/lib/firebase';
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
} from "@/components/ui/sidebar";
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { doc, getDoc } from 'firebase/firestore';

const ADMIN_AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = auth.currentUser;
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    const verifyAccess = useCallback(async () => {
        const authTimestampStr = sessionStorage.getItem('adminAuthTimestamp');
        if (authTimestampStr && Date.now() - parseInt(authTimestampStr, 10) < ADMIN_AUTH_TIMEOUT) {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const role = userDoc.data().role;
                        setUserRole(role);
                        if (role === 'admin') {
                            setIsAuthenticated(true);
                            return;
                        }
                    }
                } catch (error) {
                    console.error("Error verifying user role:", error);
                }
            }
        }
        setIsAuthenticated(false);
    }, [user]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                verifyAccess();
            } else {
                setIsAuthenticated(false);
            }
        });
        return () => unsubscribe();
    }, [verifyAccess]);
    
    const handleAuthentication = () => {
        sessionStorage.setItem('adminAuthTimestamp', Date.now().toString());
        setIsAuthenticated(true);
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
      { href: '/admin/terminal', icon: <Code />, label: 'Terminal' },
      { href: '/admin/gemini-updates', icon: <Bot />, label: 'Gemini & AI' },
      { href: '/admin/technologies', icon: <Code />, label: 'Teknolojilerimiz' },
    ];
    
     if (isAuthenticated === null) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }

    if (!isAuthenticated) {
        return <AdminAuthPage onAuthenticated={handleAuthentication} />;
    }

    const SidebarNavigation = () => (
        <>
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
                                    {React.cloneElement(item.icon, { className: "h-5 w-5" })}
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin-mod')}>
                            <Link href="/admin-mod">
                                <ShieldHalf className="h-5 w-5"/>
                                <span>Mod Paneli</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </>
    );

    return (
        <SidebarProvider>
            <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
              <Sidebar side="left" variant="sidebar" collapsible="icon" className="hidden md:flex">
                  <SidebarNavigation />
              </Sidebar>
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
                       <SidebarProvider>
                           <SidebarNavigation />
                       </SidebarProvider>
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
        </SidebarProvider>
    );
}
