
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, LogOut, PanelLeft, Search, ShieldAlert, Users2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminAuthPage from './auth/page';

const FIVE_MINUTES = 5 * 60 * 1000;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = auth.currentUser;
    const router = useRouter();
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

    if (!isAuthenticated) {
        return <AdminAuthPage onAuthenticated={handleAuthentication} />;
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
                <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold">
                    <ShieldAlert className="h-7 w-7 text-primary" />
                    <span className="font-bold text-foreground">Admin Paneli</span>
                </Link>

                <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                    <Link href="/admin-mod" className="text-muted-foreground transition-colors hover:text-foreground">
                        Moderatör Paneli
                    </Link>
                </nav>
                
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
                        <AvatarFallback>{user.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
                    </Avatar>
                )}
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-8 sm:py-6 bg-background">
                {children}
            </main>
        </div>
    );
}
