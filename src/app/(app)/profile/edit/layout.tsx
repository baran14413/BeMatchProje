
'use client';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { User, Camera, Heart, SlidersHorizontal, Bell, Shield, KeyRound, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const sidebarNavItems = [
  {
    title: 'Kişisel Bilgiler',
    href: '/profile/edit/personal',
    icon: <User className="w-4 h-4" />,
  },
  {
    title: 'Fotoğrafları Yönet',
    href: '/profile/edit/photos',
    icon: <Camera className="w-4 h-4" />,
  },
  {
    title: 'Keşfet Ayarları',
    href: '/profile/edit/discovery',
    icon: <SlidersHorizontal className="w-4 h-4" />,
  },
  {
    title: 'Bildirim Ayarları',
    href: '/profile/edit/notifications',
    icon: <Bell className="w-4 h-4" />,
  },
  {
    title: 'Şifre ve Güvenlik',
    href: '/profile/edit/security',
    icon: <KeyRound className="w-4 h-4" />,
  },
  {
    title: 'Gizlilik ve İzinler',
    href: '/profile/edit/privacy',
    icon: <Shield className="w-4 h-4" />,
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-8 space-y-8">
      <div className="flex flex-col items-start">
        <h1 className="text-3xl font-bold font-headline">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">
          Profilinizi, tercihlerinizi ve hesap ayarlarınızı yönetin.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {sidebarNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                  'justify-start'
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
