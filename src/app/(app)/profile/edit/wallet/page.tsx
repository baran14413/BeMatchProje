
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// Mock data - in a real app this would come from an API
const subscription = {
    isActive: true,
    planName: '1 Aylık Premium',
    expiresAt: '24 Temmuz 2024',
};

export default function WalletPage() {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Cüzdanım ve Abonelik</CardTitle>
                <CardDescription>
                    Mevcut abonelik durumunuzu ve ödeme bilgilerinizi yönetin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {subscription.isActive ? (
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
            {subscription.isActive && (
                <CardFooter className="flex justify-between items-center border-t pt-6">
                    <p className="text-sm text-muted-foreground">Aboneliğinizi yönetin.</p>
                    <div className="flex gap-2">
                        <Button variant="outline">Aboneliği İptal Et</Button>
                        <Button>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Şimdi Yenile
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
