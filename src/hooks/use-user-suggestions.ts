
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt, DocumentData } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';

type SuggestedUser = {
  uid: string;
  name: string;
  username: string;
  avatarUrl: string;
};

export const useUserSuggestions = (rawQuery: string | null) => {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser;
  const [debouncedQuery] = useDebounce(rawQuery, 300);

  const fetchSuggestions = useCallback(async () => {
    if (debouncedQuery === null || !currentUser) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    
    try {
        const uniqueUsers = new Map<string, SuggestedUser>();

        // Function to process and add users to the map
        const processDocs = (docs: DocumentData[], usersMap: Map<string, SuggestedUser>) => {
            docs.forEach(doc => {
                const data = doc.data();
                if (data.uid && data.uid !== currentUser.uid && !usersMap.has(data.uid)) {
                    usersMap.set(data.uid, {
                        uid: data.uid,
                        name: data.name,
                        username: data.username,
                        avatarUrl: data.avatarUrl,
                    });
                }
            });
        };

      // 1. Fetch users based on search query (name or username)
      if (debouncedQuery.length > 0) {
        const nameQuery = query(
          collection(db, 'users'),
          orderBy('name'),
          startAt(debouncedQuery),
          endAt(debouncedQuery + '\uf8ff'),
          limit(5)
        );
        const usernameQuery = query(
             collection(db, 'users'),
             orderBy('username'),
             startAt(debouncedQuery),
             endAt(debouncedQuery + '\uf8ff'),
             limit(5)
        );
        
        const [nameSnapshot, usernameSnapshot] = await Promise.all([
            getDocs(nameQuery),
            getDocs(usernameQuery)
        ]);

        processDocs(nameSnapshot.docs, uniqueUsers);
        processDocs(usernameSnapshot.docs, uniqueUsers);
      } else {
         // 2. If query is empty, fetch following and followers
         const followingQuery = query(collection(db, 'users', currentUser.uid, 'following'), limit(5));
         const followersQuery = query(collection(db, 'users', currentUser.uid, 'followers'), limit(5));

         const [followingSnapshot, followersSnapshot] = await Promise.all([
             getDocs(followingQuery),
             getDocs(followersQuery),
         ]);
         
         const followingIds = followingSnapshot.docs.map(doc => doc.id);
         const followerIds = followersSnapshot.docs.map(doc => doc.id);

         const suggestionIds = [...new Set([...followingIds, ...followerIds])];

         if (suggestionIds.length > 0) {
             const usersQuery = query(collection(db, 'users'), where('uid', 'in', suggestionIds));
             const usersSnapshot = await getDocs(usersQuery);
             processDocs(usersSnapshot.docs, uniqueUsers);
         }
      }

      setSuggestions(Array.from(uniqueUsers.values()));

    } catch (error) {
      console.error("Error fetching user suggestions:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, currentUser]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return { suggestions, loading };
};
