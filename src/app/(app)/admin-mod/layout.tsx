
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogOut, MessageSquareWarning, Search, ShieldHalf } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminModLayout({ children }: { children: React.ReactNode }) {
    const user = auth.currentUser;
    const pathname = usePathname();

    const getPageTitle = () => {
        if (pathname === '/admin-mod') return 'Moderatör Paneli';
        if (pathname === '/admin-mod/reported-content') return 'Şikayet Yönetimi';
        return 'Panel';
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
                 <Link href="/admin-mod" className="flex items-center gap-2 text-lg font-semibold">
                    <ShieldHalf className="h-7 w-7 text-primary" />
                    <span className="font-bold text-foreground">Mod Paneli</span>
                </Link>
                 <div className="relative ml-auto flex-1 md:grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Ara..."
                        className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]"
                    />
                </div>
                 <Link href="/explore">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Paneleden Çık</span>
                    </Button>
                </Link>
                {user?.photoURL && (
                    <Avatar className="w-9 h-9">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback>{user.displayName?.charAt(0) ?? 'M'}</AvatarFallback>
                    </Avatar>
                )}
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-8 sm:py-6">
                {children}
            </main>
        </div>
    );
}
