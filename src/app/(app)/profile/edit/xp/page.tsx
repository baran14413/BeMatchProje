
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Loader2, Trophy, Award, Gift, MessageSquarePlus, Star, ThumbsUp, Send } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, DocumentData } from 'firebase/firestore';
import { LevelBadge } from '@/components/ui/level-badge';
import Link from 'next/link';
import { XP_VALUES, XP_REASONS } from '@/config/xp-config';

const calculateXpForNextLevel = (level: number) => (level + 1) * 100;

const xpActions = [
    { action: 'NEW_POST', icon: <Send className="w-5 h-5 text-blue-500" />, text: XP_REASONS.new_post, xp: XP_VALUES.NEW_POST },
    { action: 'COMMENT_SENT', icon: <MessageSquarePlus className="w-5 h-5 text-green-500" />, text: XP_REASONS.comment_sent, xp: XP_VALUES.COMMENT_SENT },
    { action: 'LIKE_SENT', icon: <ThumbsUp className="w-5 h-5 text-pink-500" />, text: XP_REASONS.like_sent, xp: XP_VALUES.LIKE_SENT },
    { action: 'COMMENT_RECEIVED', icon: <Gift className="w-5 h-5 text-purple-500" />, text: XP_REASONS.comment_received, xp: XP_VALUES.COMMENT_RECEIVED },
    { action: 'LIKE_RECEIVED', icon: <Star className="w-5 h-5 text-yellow-500" />, text: XP_REASONS.like_received, xp: XP_VALUES.LIKE_RECEIVED },
];

export default function XpPage() {
    const [userData, setUserData] = useState<DocumentData | null>(null);
    const [leaderboard, setLeaderboard] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setUserData({ ...doc.data(), id: doc.id });
            }
            setLoading(false);
        });

        const leaderboardQuery = query(collection(db, 'users'), orderBy('level', 'desc'), orderBy('xp', 'desc'), limit(10));
        const unsubscribeLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setLeaderboard(users);
        });
        
        return () => {
            unsubscribeUser();
            unsubscribeLeaderboard();
        };

    }, [currentUser]);

    if (loading) {
        return <div className="flex justify-center items-center p-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }
    
    if (!userData) {
         return <div className="text-center text-muted-foreground p-10">Kullanıcı verileri bulunamadı.</div>;
    }

    const currentLevel = userData.level || 1;
    const currentXp = userData.xp || 0;
    const xpForNext = calculateXpForNextLevel(currentLevel);
    const progress = (currentXp / xpForNext) * 100;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <LevelBadge level={currentLevel} size="xl" />
                    </div>
                    <CardTitle className="text-3xl">Seviye {currentLevel}</CardTitle>
                    <CardDescription>Mevcut deneyim puanınız ve bir sonraki seviyeye kalan miktar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Progress value={progress} indicatorClassName="bg-gradient-to-r from-yellow-400 to-amber-500" />
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                        <span>{currentXp.toLocaleString()} XP</span>
                        <span>{xpForNext.toLocaleString()} XP</span>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        Sonraki seviyeye ulaşmak için <strong>{(xpForNext - currentXp).toLocaleString()} XP</strong> daha kazanmalısınız.
                    </p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Award className="w-6 h-6 text-green-500" />
                        <CardTitle>Nasıl XP Kazanılır?</CardTitle>
                    </div>
                    <CardDescription>Uygulamada aktif olarak XP kazanın ve sıralamada yükselin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                       {xpActions.map(item => (
                            <div key={item.action} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                    {item.icon}
                                    <span className="font-medium text-sm">{item.text}</span>
                                </div>
                                <span className="font-bold text-sm text-green-600">+{item.xp} XP</span>
                            </div>
                       ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                         <Trophy className="w-6 h-6 text-yellow-500"/>
                        <CardTitle>Liderlik Sıralaması</CardTitle>
                    </div>
                    <CardDescription>En yüksek seviyeye sahip öncü kullanıcılar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                       {leaderboard.map((user, index) => (
                           <Link href={`/profile/${user.username}`} key={user.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
                               <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                               <Avatar>
                                   <AvatarImage src={user.avatarUrl} />
                                   <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div className="flex-1">
                                   <p className="font-semibold">{user.name}</p>
                                   <p className="text-sm text-muted-foreground">@{user.username}</p>
                               </div>
                               <LevelBadge level={user.level || 1} />
                           </Link>
                       ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
