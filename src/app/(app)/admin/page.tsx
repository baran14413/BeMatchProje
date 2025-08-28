
'use client';

import React from 'react';
import {
  Users,
  ShieldCheck,
  Ban,
  LineChart,
  ChevronRight,
  ShieldAlert,
  MessageSquareWarning,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AdminMenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  isFirst?: boolean;
  isLast?: boolean;
}

const AdminMenuItem: React.FC<AdminMenuItemProps> = ({ icon, title, description, href, isFirst, isLast }) => {
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


const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="px-4 pt-4 pb-2 text-lg font-semibold text-foreground">{title}</h2>
);


export default function AdminDashboardPage() {

    const userManagementItems = [
        { icon: <Users className="h-7 w-7" />, title: 'Kullanıcıları Yönet', description: 'Tüm kullanıcıları görüntüleyin veya silin.', href: '/admin/users' },
    ];
    
    const contentAndSecurityItems = [
        { icon: <MessageSquareWarning className="h-7 w-7" />, title: 'Rapor Edilen İçerikler', description: 'Kullanıcılar tarafından şikayet edilen gönderileri inceleyin.', href: '/admin/reported-content' },
        { icon: <Star className="h-7 w-7" />, title: 'Geri Bildirimler', description: 'Kullanıcıların uygulama deneyimleri hakkındaki görüşleri.', href: '/admin/feedback' },
        { icon: <ShieldCheck className="h-7 w-7" />, title: 'Aktivite Kayıtları', description: 'Uygulamadaki son kullanıcı aktivitelerini ve IP adreslerini görüntüleyin.', href: '/admin/activity-logs' },
        { icon: <Ban className="h-7 w-7" />, title: 'Engellenen IP Adresleri', description: 'Uygulamaya erişimi engellenen IP adreslerini yönetin.', href: '/admin/blocked-ips' },
    ];

    const systemItems = [
        { icon: <LineChart className="h-7 w-7" />, title: 'Sistem Durumu', description: 'Uygulama metriklerini ve genel performansı izleyin.', href: '/admin/system-status' },
    ];

  return (
    <div className="space-y-6">
        <Card className="overflow-hidden">
            <CardHeader className='bg-muted/30'>
                <div className="flex items-center gap-3">
                     <ShieldAlert className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>Yönetim Paneli</CardTitle>
                        <CardDescription>BeMatch uygulamasının yönetim merkezi.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                
                <SectionTitle title="Kullanıcı Yönetimi" />
                {userManagementItems.map((item, index) => (
                    <React.Fragment key={item.title}>
                        <AdminMenuItem {...item} />
                        {index < userManagementItems.length - 1 && <Separator />}
                    </React.Fragment>
                ))}
                
                <Separator />

                <SectionTitle title="İçerik ve Güvenlik" />
                 {contentAndSecurityItems.map((item, index) => (
                    <React.Fragment key={item.title}>
                        <AdminMenuItem {...item} />
                        {index < contentAndSecurityItems.length - 1 && <Separator />}
                    </React.Fragment>
                ))}

                <Separator />
                
                <SectionTitle title="Sistem" />
                 {systemItems.map((item, index) => (
                    <React.Fragment key={item.title}>
                        <AdminMenuItem {...item} />
                        {index < systemItems.length - 1 && <Separator />}
                    </React.Fragment>
                ))}

            </CardContent>
        </Card>
    </div>
  );
}
