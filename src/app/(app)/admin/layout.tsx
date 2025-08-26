
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
import { Home, Users, Settings, LogOut, PanelLeft, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


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
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="p-4">
                     <Link href="/explore" className="flex items-center gap-2 text-lg font-semibold">
                        <Heart className="h-7 w-7 text-primary" />
                        <span className="font-bold text-foreground">BeMatch</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <SidebarMenu>
                       <NavItem href="/admin" icon={<Home />} label="Genel Bakış" />
                       <NavItem href="/admin/users" icon={<Users />} label="Kullanıcılar" />
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="p-4 border-t">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.photoURL || ''} />
                            <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                             <p className="font-semibold truncate">{user?.displayName || 'Admin'}</p>
                             <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                         <Link href="/logout">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <LogOut className="w-5 h-5"/>
                            </Button>
                        </Link>
                    </div>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                 <header className="flex items-center justify-between p-4 border-b bg-background">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-2xl font-bold font-headline">Yönetim Paneli</h1>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/40">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
