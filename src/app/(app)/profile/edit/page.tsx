
'use client';

import React from 'react';
import {
  User,
  Shield,
  KeyRound,
  Bell,
  SlidersHorizontal,
  ChevronRight,
  Palette,
  Filter,
  Settings as Cog,
  HelpCircle,
  Trash2,
  LogOut,
  Store,
  Wallet,
  Lock,
  Ban,
  History,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  value?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, href, value, isFirst, isLast }) => (
  <Link href={href} className={cn(
    "flex items-center p-4 transition-colors hover:bg-muted/50",
    isFirst && "rounded-t-lg",
    isLast && "rounded-b-lg"
  )}>
    <div className="mr-4 text-muted-foreground">{icon}</div>
    <div className="flex-1 font-medium">{title}</div>
    <div className="flex items-center text-muted-foreground">
        {value && <span className="mr-2 text-sm">{value}</span>}
        <ChevronRight className="h-5 w-5" />
    </div>
  </Link>
);

const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="px-4 py-2 text-sm font-semibold text-primary">{title}</h2>
);

export default function EditProfilePage() {

    const accountItems = [
        { icon: <User className="h-6 w-6" />, title: 'Profili Düzenle', href: '/profile/edit/personal' },
        { icon: <ImageIcon className="h-6 w-6" />, title: 'Fotoğrafları Yönet', href: '/profile/edit/photos' },
        { icon: <Store className="h-6 w-6" />, title: 'Mağaza', href: '/premium' },
        { icon: <Wallet className="h-6 w-6" />, title: 'Cüzdanım', href: '#' },
    ];
    
    const privacyAndSecurityItems = [
        { icon: <Lock className="h-6 w-6" />, title: 'Hesap Gizliliği', href: '/profile/edit/privacy' },
        { icon: <KeyRound className="h-6 w-6" />, title: 'E-posta & Şifre', href: '/profile/edit/security' },
        { icon: <History className="h-6 w-6" />, title: 'Oturum Yönetimi', href: '/profile/edit/sessions' },
        { icon: <Ban className="h-6 w-6" />, title: 'Engellenen Hesaplar', href: '/profile/edit/blocked' },
    ];
    
    const appearanceItems = [
        { icon: <Palette className="h-6 w-6" />, title: 'Görünüm', href: '/profile/edit/appearance' },
    ];
    
    const contentPreferenceItems = [
        { icon: <Filter className="h-6 w-6" />, title: 'Ana Akış Ayarları', href: '/profile/edit/discovery' },
    ];

    const applicationItems = [
        { icon: <Bell className="h-6 w-6" />, title: 'Bildirim Ayarları', href: '/profile/edit/notifications' },
        { icon: <HelpCircle className="h-6 w-6" />, title: 'Uygulama Kılavuzu', href: '/profile/edit/guide' },
    ];
    
    const otherItems = [
        { icon: <Trash2 className="h-6 w-6" />, title: 'Hesabı Sil', href: '/profile/edit/delete' },
        { icon: <LogOut className="h-6 w-6" />, title: 'Çıkış Yap', href: '#' },
    ];

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
        <div className="space-y-4">
             <div>
                <SectionTitle title="Hesap" />
                <Card>
                    <CardContent className="p-0">
                        {accountItems.map((item, index) => (
                            <React.Fragment key={item.title}>
                                <SettingsItem 
                                    icon={item.icon} 
                                    title={item.title} 
                                    href={item.href}
                                    isFirst={index === 0}
                                    isLast={index === accountItems.length -1}
                                />
                                {index < accountItems.length - 1 && <Separator className="bg-border/50" />}
                            </React.Fragment>
                        ))}
                    </CardContent>
                </Card>
            </div>
             <div>
                <SectionTitle title="Gizlilik ve Güvenlik" />
                <Card>
                    <CardContent className="p-0">
                        {privacyAndSecurityItems.map((item, index) => (
                             <React.Fragment key={item.title}>
                                <SettingsItem
                                    icon={item.icon}
                                    title={item.title}
                                    href={item.href}
                                    isFirst={index === 0}
                                    isLast={index === privacyAndSecurityItems.length -1}
                                />
                                 {index < privacyAndSecurityItems.length - 1 && <Separator className="bg-border/50" />}
                            </React.Fragment>
                        ))}
                    </CardContent>
                </Card>
            </div>
             <div>
                <SectionTitle title="Uygulama" />
                <Card>
                    <CardContent className="p-0">
                        {applicationItems.map((item, index) => (
                             <React.Fragment key={item.title}>
                                <SettingsItem
                                    icon={item.icon}
                                    title={item.title}
                                    href={item.href}
                                    isFirst={index === 0}
                                    isLast={index === applicationItems.length -1}
                                />
                                 {index < applicationItems.length - 1 && <Separator className="bg-border/50" />}
                            </React.Fragment>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="space-y-4">
             <div>
                <SectionTitle title="Görünüm" />
                <Card>
                    <CardContent className="p-0">
                        {appearanceItems.map((item, index) => (
                            <React.Fragment key={item.title}>
                                <SettingsItem 
                                    icon={item.icon} 
                                    title={item.title} 
                                    href={item.href}
                                    isFirst={index === 0}
                                    isLast={index === appearanceItems.length -1}
                                />
                                {index < appearanceItems.length - 1 && <Separator className="bg-border/50" />}
                            </React.Fragment>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div>
                <SectionTitle title="İçerik Tercihleri" />
                <Card>
                    <CardContent className="p-0">
                        {contentPreferenceItems.map((item, index) => (
                             <React.Fragment key={item.title}>
                                <SettingsItem
                                    icon={item.icon}
                                    title={item.title}
                                    href={item.href}
                                    isFirst={index === 0}
                                    isLast={index === contentPreferenceItems.length -1}
                                />
                                 {index < contentPreferenceItems.length - 1 && <Separator className="bg-border/50" />}
                            </React.Fragment>
                        ))}
                    </CardContent>
                </Card>
            </div>

             <div>
                <SectionTitle title="Diğer" />
                <Card>
                    <CardContent className="p-0">
                        {otherItems.map((item, index) => (
                             <React.Fragment key={item.title}>
                                <SettingsItem
                                    icon={item.icon}
                                    title={item.title}
                                    href={item.href}
                                    isFirst={index === 0}
                                    isLast={index === otherItems.length -1}
                                />
                                 {index < otherItems.length - 1 && <Separator className="bg-border/50" />}
                            </React.Fragment>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
