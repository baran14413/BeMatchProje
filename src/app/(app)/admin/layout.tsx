'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async (user: User | null) => {
      const secretKey = searchParams.get('key');
      const envKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;

      // Allow access if a valid secret key is provided in the URL
      if (envKey && secretKey === envKey) {
        setAuthStatus('authorized');
        return;
      }
      
      // If no secret key, check for admin role
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists() && userDoc.data().isAdmin === true) {
            setAuthStatus('authorized');
          } else {
            setAuthStatus('unauthorized');
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setAuthStatus('unauthorized');
        }
      } else {
        setAuthStatus('unauthorized');
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      checkAuth(user);
    });

    return () => unsubscribe();
  }, [searchParams]);

  if (authStatus === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Yetki kontrol ediliyor...</p>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="text-center">
            <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-destructive">Erişim Reddedildi</h1>
            <p className="text-muted-foreground mt-2">
                Bu sayfayı görüntüleme yetkiniz yok.
            </p>
            <Button asChild className="mt-6">
                <Link href="/explore">Ana Sayfaya Dön</Link>
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Paneli</h1>
      {children}
    </div>
  );
}
