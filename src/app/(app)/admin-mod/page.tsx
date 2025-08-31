
'use client';

import React from 'react';
import {
  ChevronRight,
  ShieldHalf,
  MessageSquareWarning,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AdminMenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const AdminMenuItem: React.FC<AdminMenuItemProps> = ({ icon, title, description, href }) => {
  return (
    <Link href={href} className="block hover:bg-muted/50 rounded-lg">
        <div className="flex items-center p-4">
            <div className="mr-4 text-primary">{icon}</div>
            <div className="flex-1">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
    </Link>
  );
};

export default function AdminModDashboardPage() {

    const moderationItems = [
        { icon: <MessageSquareWarning className="h-7 w-7" />, title: 'Şikayet Yönetimi', description: 'Kullanıcılar tarafından şikayet edilen içerikleri inceleyin.', href: '/admin-mod/reported-content' },
    ];

  return (
    <div className="space-y-6">
        <Card className="overflow-hidden">
            <CardHeader className='bg-muted/30'>
                <div className="flex items-center gap-3">
                     <ShieldHalf className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>Moderatör Paneli</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {moderationItems.map((item, index) => (
                    <React.Fragment key={item.title}>
                        <AdminMenuItem {...item} />
                        {index < moderationItems.length - 1 && <Separator />}
                    </React.Fragment>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
