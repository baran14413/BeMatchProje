
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserX, Loader2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type BlockedUser = {
  uid: string;
  name: string;
  avatarUrl: string;
  aiHint?: string;
};

export default function BlockedAccountsPage() {
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    useEffect(() => {
        const fetchBlockedUsers = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const blockedIds = userDoc.data().blockedUsers || [];
                    if (blockedIds.length > 0) {
                        const blockedUserPromises = blockedIds.map((id: string) => getDoc(doc(db, 'users', id)));
                        const blockedUserDocs = await Promise.all(blockedUserPromises);
                        const users = blockedUserDocs
                            .filter(doc => doc.exists())
                            .map(doc => ({ uid: doc.id, ...doc.data() } as BlockedUser));
                        setBlockedUsers(users);
                    }
                }
            } catch (error) {
                console.error("Error fetching blocked users:", error);
                toast({ variant: 'destructive', title: "Engellenen kullanıcılar alınamadı." });
            } finally {
                setLoading(false);
            }
        };

        fetchBlockedUsers();
    }, [currentUser, toast]);
    
    const unblockUser = async (userIdToUnblock: string) => {
        if (!currentUser) return;
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                blockedUsers: arrayRemove(userIdToUnblock)
            });
            setBlockedUsers(prev => prev.filter(u => u.uid !== userIdToUnblock));
            toast({ title: "Engelleme kaldırıldı." });
        } catch (error) {
            console.error("Error unblocking user:", error);
            toast({ variant: 'destructive', title: "Engelleme kaldırılırken bir hata oluştu." });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Engellenen Hesaplar</CardTitle>
                <CardDescription>
                    Engellediğiniz kişileri buradan yönetebilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center p-10">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : blockedUsers.length > 0 ? (
                     <div className="space-y-4">
                        {blockedUsers.map(user => (
                            <div key={user.uid} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl} data-ai-hint={user.aiHint} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{user.name}</span>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => unblockUser(user.uid)}>Engeli Kaldır</Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10 border-2 border-dashed rounded-lg">
                        <UserX className="w-12 h-12 mb-4" />
                        <h3 className="text-lg font-semibold">Engellenmiş Kullanıcı Yok</h3>
                        <p className="text-sm">Birini engellediğinizde burada görünecektir.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
