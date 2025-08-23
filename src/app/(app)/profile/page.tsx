// This file is now redundant because profiles are handled by [username]/page.tsx.
// It redirects to the a default page to avoid 404s if a user lands here.
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const username = userDoc.data().username;
                if(username) {
                    router.replace(`/profile/${username}`);
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to get user document for redirect", e);
        }
        // Fallback if user doc or username not found
        router.replace('/explore');

      } else {
         router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);
  
  // Render a loading state while redirecting
  return (
      <div className="flex h-screen w-full items-center justify-center">
          <p>Yönlendiriliyor...</p>
      </div>
  );
}
