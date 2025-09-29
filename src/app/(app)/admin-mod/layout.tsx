
'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Home, ShieldHalf, Search, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminModLayout({ children }: { children: ReactNode }) {
    const user = auth.currentUser;

    return (
        <div className="min-h-screen w-full bg-muted/40">
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
                <Link href="/admin-mod" className="flex items-center gap-2 text-lg font-semibold">
                    <ShieldHalf className="h-6 w-6 text-primary" />
                    <span className="font-bold text-foreground">Moderatör Paneli</span>
                </Link>
                <div className="w-full flex-1">
                    <form>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Şikayet, kullanıcı veya gönderi ara..."
                                className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                            />
                        </div>
                    </form>
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
                            <AvatarFallback>{user.displayName?.charAt(0) ?? 'M'}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {children}
            </main>
        </div>
    );
}
