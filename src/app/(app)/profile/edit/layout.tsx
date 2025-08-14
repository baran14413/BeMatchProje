
'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';

const getTitleForPath = (path: string): string => {
    if (path.endsWith('/personal')) return 'Profili Düzenle';
    if (path.endsWith('/photos')) return 'Fotoğrafları Yönet';
    if (path.endsWith('/discovery')) return 'Ana Akış Ayarları';
    if (path.endsWith('/notifications')) return 'Uygulama Ayarları';
    if (path.endsWith('/security')) return 'E-posta & Şifre';
    if (path.endsWith('/privacy')) return 'Hesap Gizliliği';
    if (path.endsWith('/blocked')) return 'Engellenen Hesaplar';
    if (path.endsWith('/sessions')) return 'Oturum Yönetimi';
    if (path.endsWith('/appearance')) return 'Görünüm';
    if (path.endsWith('/guide')) return 'Uygulama Kılavuzu';
    if (path.endsWith('/delete')) return 'Hesabı Sil';
    return 'Ayarlar';
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const title = getTitleForPath(pathname);
  
  const isMainSettingsPage = pathname === '/profile/edit';

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8 space-y-6">
      <div className="flex flex-col items-start">
         <div className="flex items-center gap-4 w-full mb-4">
             {!isMainSettingsPage && (
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
             )}
            <h1 className="text-2xl font-bold font-headline">{title}</h1>
        </div>
      </div>

      <div className="flex-1">{children}</div>
    </div>
  );
}
