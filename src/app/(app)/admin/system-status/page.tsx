
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Newspaper, MessageSquare, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const StatCard = ({ title, value, icon, loading }: { title: string; value: number; icon: React.ReactNode; loading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <div className="text-2xl font-bold">{value.toLocaleString()}</div>}
        </CardContent>
    </Card>
);

export default function SystemStatusPage() {
    const [stats, setStats] = useState({
        users: 0,
        posts: 0,
        messages: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const postsSnapshot = await getDocs(collection(db, 'posts'));
                // Note: Counting all messages can be very slow and expensive.
                // In a real app, this should be a counter updated by cloud functions.
                // For this example, we'll keep it, but be aware of the performance implications.
                const messagesSnapshot = await getDocs(collection(db, 'conversations'));
                let totalMessages = 0;
                for (const convoDoc of messagesSnapshot.docs) {
                    const messagesSubColl = await getDocs(collection(db, `conversations/${convoDoc.id}/messages`));
                    totalMessages += messagesSubColl.size;
                }

                setStats({
                    users: usersSnapshot.size,
                    posts: postsSnapshot.size,
                    messages: totalMessages,
                });
            } catch (error) {
                console.error("Error fetching system stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Sistem Durumu</CardTitle>
                    <CardDescription>Uygulama genelindeki temel metrikler ve istatistikler.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <StatCard title="Toplam Kullanıcı" value={stats.users} icon={<Users className="h-4 w-4 text-muted-foreground" />} loading={loading} />
                        <StatCard title="Toplam Gönderi" value={stats.posts} icon={<Newspaper className="h-4 w-4 text-muted-foreground" />} loading={loading} />
                        <StatCard title="Toplam Mesaj" value={stats.messages} icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} loading={loading} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
