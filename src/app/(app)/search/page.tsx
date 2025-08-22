
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useDebounce } from 'use-debounce';

type User = {
    uid: string;
    name: string;
    username: string;
    avatarUrl: string;
    aiHint?: string;
};

export default function SearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const currentUser = auth.currentUser;
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!debouncedSearchTerm.trim()) {
                setResults([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'users'),
                    orderBy('name'),
                    startAt(debouncedSearchTerm),
                    endAt(debouncedSearchTerm + '\uf8ff'),
                    limit(10)
                );

                const querySnapshot = await getDocs(q);
                const users = querySnapshot.docs
                    .map(doc => doc.data() as User)
                    .filter(user => user.uid !== currentUser?.uid);
                setResults(users);
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [debouncedSearchTerm, currentUser]);

    return (
        <div className="container mx-auto max-w-xl py-4 flex flex-col h-full">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Kullanıcı ara..."
                    className="w-full pl-10 text-lg h-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="flex-1 overflow-y-auto mt-4">
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : results.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {results.map((user) => (
                            <Link href={`/profile/${user.uid}`} key={user.uid} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={user.avatarUrl} data-ai-hint={user.aiHint} />
                                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : searchTerm.trim() && !loading ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>"{searchTerm}" için sonuç bulunamadı.</p>
                    </div>
                ) : (
                     <div className="text-center py-20 text-muted-foreground">
                        <p>Takip ettiğin veya tanıyor olabileceğin kişileri ara.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
