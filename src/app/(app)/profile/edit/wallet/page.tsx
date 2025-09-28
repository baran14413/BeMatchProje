
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type Subscription = {
    planName: string;
    expiresAt: string;
};

export default function WalletPage() {
    const router = useRouter();
    const currentUser = auth.currentUser;
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isPremium, setIsPremium] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setIsPremium(userData.isPremium || false);
                
                if (userData.isPremium && userData.subscription) {
                    setSubscription({
                        planName: userData.subscription.planName || 'Premium Üyelik',
                        expiresAt: userData.subscription.expiresAt?.toDate() 
                            ? format(userData.subscription.expiresAt.toDate(), "dd MMMM yyyy", { locale: tr })
                            : 'Bilinmiyor'
                    });
                } else {
                    setSubscription(null);
                }
            } else {
                setIsPremium(false);
                setSubscription(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user subscription data:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);


    if (loading) {
        return (
            <div className="flex justify-center items-center p-10">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Cüzdanım ve Abonelik</CardTitle>
            </CardHeader>
            <CardContent>
                {isPremium && subscription ? (
                    <div className="p-6 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-full shadow-md">
                                <Gem className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">{subscription.planName}</h3>
                                <p className="text-sm text-muted-foreground">Aktif Abonelik</p>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center gap-3 text-muted-foreground">
                            <Calendar className="w-5 h-5" />
                            <span>Sonraki yenileme tarihi: <span className="font-semibold text-foreground">{subscription.expiresAt}</span></span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-10 border-2 border-dashed rounded-lg">
                        <Gem className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">Aktif Aboneliğiniz Yok</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                           Premium özelliklerden yararlanmak için mağazayı ziyaret edin.
                        </p>
                        <Link href="/premium">
                            <Button className="mt-4">
                                Mağazaya Git
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
             {isPremium && (
                <CardFooter className="flex justify-between items-center border-t pt-6">
                    <p className="text-sm text-muted-foreground">Aboneliğinizi yönetin.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" disabled>Aboneliği İptal Et</Button>
                        <Link href="/premium">
                            <Button>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Paketleri Gör
                            </Button>
                        </Link>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
