
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';

export type SuggestedHashtag = {
  tag: string;
  count: number;
};

// This is a simplified version. In a real, large-scale app,
// you'd likely have a dedicated collection for aggregated hashtag data
// that gets updated by a cloud function.
// For this project, we'll query the posts directly, which can be slow and expensive.
// To optimize, we'll fetch all unique hashtags once and filter client-side.
let allHashtags: Map<string, number> | null = null;
let lastFetchTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useHashtagSuggestions = (rawQuery: string | null) => {
  const [suggestions, setSuggestions] = useState<SuggestedHashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery] = useDebounce(rawQuery, 300);

  const fetchAndCacheHashtags = useCallback(async () => {
    const now = Date.now();
    if (allHashtags && lastFetchTimestamp && (now - lastFetchTimestamp < CACHE_DURATION)) {
      return; // Use cache
    }

    setLoading(true);
    try {
      const postsQuery = query(collection(db, 'posts'));
      const querySnapshot = await getDocs(postsQuery);
      const hashtagCounts = new Map<string, number>();

      querySnapshot.forEach(doc => {
        const hashtags = doc.data().hashtags as string[] | undefined;
        if (hashtags && Array.isArray(hashtags)) {
          hashtags.forEach(tag => {
            hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
          });
        }
      });
      allHashtags = hashtagCounts;
      lastFetchTimestamp = now;
    } catch (error) {
      console.error("Error fetching all hashtags:", error);
      allHashtags = new Map(); // Prevent refetching on every keystroke after failure
    } finally {
        setLoading(false);
    }
  }, []);

  const filterHashtags = useCallback(() => {
    if (debouncedQuery === null) {
      setSuggestions([]);
      return;
    }
    
    if (!allHashtags) {
        setSuggestions([]);
        return;
    }

    const filtered = Array.from(allHashtags.entries())
        .filter(([tag]) => tag.toLowerCase().startsWith(debouncedQuery.toLowerCase()))
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));
    
    setSuggestions(filtered);

  }, [debouncedQuery]);


  useEffect(() => {
    const init = async () => {
        setLoading(true);
        await fetchAndCacheHashtags();
        setLoading(false);
        filterHashtags();
    }
    if(debouncedQuery !== null){
       init();
    }
  }, [fetchAndCacheHashtags, filterHashtags, debouncedQuery]);

  return { suggestions, loading };
};
