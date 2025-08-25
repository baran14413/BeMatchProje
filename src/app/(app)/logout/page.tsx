
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut(auth);
        toast({
          title: 'Çıkış Yapıldı',
          description: 'Başarıyla çıkış yaptınız. Yönlendiriliyorsunuz...',
        });
        router.replace('/login');
      } catch (error) {
        console.error('Logout error', error);
        toast({
          variant: 'destructive',
          title: 'Çıkış Yapılamadı',
          description: 'Çıkış yaparken bir hata oluştu.',
        });
        router.replace('/explore'); // Redirect back if logout fails
      }
    };

    performLogout();
  }, [router, toast]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">Güvenli bir şekilde çıkış yapılıyor...</p>
    </div>
  );
}
