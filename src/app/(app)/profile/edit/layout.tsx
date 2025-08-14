
'use client';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { User, Camera, SlidersHorizontal, Bell, Shield, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const sidebarNavItems = [
  {
    title: 'Kişisel Bilgiler',
    href: '/profile/edit/personal',
    icon: <User className="w-5 h-5" />,
  },
  {
    title: 'Fotoğraflar',
    href: '/profile/edit/photos',
    icon: <Camera className="w-5 h-5" />,
  },
  {
    title: 'Keşfet Ayarları',
    href: '/profile/edit/discovery',
    icon: <SlidersHorizontal className="w-5 h-5" />,
  },
  {
    title: 'Bildirimler',
    href: '/profile/edit/notifications',
    icon: <Bell className="w-5 h-5" />,
  },
    {
    title: 'Güvenlik',
    href: '/profile/edit/security',
    icon: <KeyRound className="w-5 h-5" />,
  },
  {
    title: 'Gizlilik',
    href: '/profile/edit/privacy',
    icon: <Shield className="w-5 h-5" />,
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8 space-y-6">
      <div className="flex flex-col items-start">
        <h1 className="text-3xl font-bold font-headline">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">
          Profilinizi, tercihlerinizi ve hesap ayarlarınızı yönetin.
        </p>
      </div>
      
      <nav className="overflow-x-auto">
        <div className="flex space-x-4 border-b pb-px">
            {sidebarNavItems.map((item) => (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                'flex flex-col items-center gap-1.5 whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-primary',
                )}
            >
                {item.icon}
                <span>{item.title}</span>
            </Link>
            ))}
        </div>
      </nav>

      <div className="flex-1">{children}</div>
    </div>
  );
}
