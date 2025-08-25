
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const username = userDoc.data().username;
                if(username) {
                    router.replace(`/profile/${username}`);
                    // No need to set loading to false, redirection is happening
                    return;
                }
            }
             // Fallback if user doc or username not found
            console.warn("User document or username not found, redirecting to explore.");
            router.replace('/explore');

        } catch (e) {
            console.error("Failed to get user document for redirect", e);
             router.replace('/explore');
        }
      } else {
         router.replace('/login');
      }
      // This will only be reached if not redirected above
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  // Render a loading state while redirecting
  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // Fallback content in case redirect takes time or fails without error
  return (
    <div className="flex h-screen w-full items-center justify-center">
        <p>Yönlendiriliyor...</p>
    </div>
  );
}
