
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async (user: User | null) => {
      // For this temporary admin panel, we'll just check if a user is logged in.
      // In a real app, you would check for a specific admin role.
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          // Simple check if the user is one of the predefined admins or has an `isAdmin` flag
          // For now, we'll assume any logged-in user can access this dev panel.
           setAuthStatus('authorized');
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
  }, []);

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
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10">
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Admin Paneli</h1>
      </div>
      {children}
    </div>
  );
}
