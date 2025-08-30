
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, HardDrive, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { clearCache } from '@/lib/firebase';

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export default function CacheManagementPage() {
    const { toast } = useToast();
    const [cacheUsage, setCacheUsage] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        const getCacheUsage = async () => {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                try {
                    const estimate = await navigator.storage.estimate();
                    setCacheUsage(estimate.usage || 0);
                } catch(e) {
                    console.error("Could not estimate storage", e);
                    setCacheUsage(0); // Set to 0 if estimation fails
                }
            } else {
                 setCacheUsage(null); // API not supported
            }
             setLoading(false);
        };
        getCacheUsage();
    }, []);

    const handleClearCache = async () => {
        setClearing(true);
        try {
            await clearCache();
            toast({
                title: 'Önbellek Temizlendi!',
                description: 'Uygulama yeniden başlatılıyor...',
                className: 'bg-green-500 text-white',
            });
            // Reload the page to apply changes
            setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
            console.error("Error clearing cache:", error);
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: error.message || 'Önbellek temizlenirken bir sorun oluştu.',
            });
            setClearing(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Önbellek Yönetimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 rounded-lg bg-muted/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <HardDrive className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Mevcut Önbellek Kullanımı</p>
                             {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mt-1" />
                             ) : (
                                 <p className="text-2xl font-bold">
                                    {cacheUsage !== null ? formatBytes(cacheUsage) : "Hesaplanamadı"}
                                </p>
                             )}
                        </div>
                    </div>
                </div>
                 <Alert variant="default" className="border-blue-500/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Bu İşlem Ne İşe Yarar?</AlertTitle>
                    <AlertDescription>
                       Önbelleği temizlemek, uygulamanın en son verileri sunucudan yeniden çekmesini sağlar ve bazı görüntüleme sorunlarını çözebilir. Bu işlem hesap verilerinizi silmez, yalnızca geçici olarak depolananları kaldırır.
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="border-t pt-6">
                 <Button variant="destructive" onClick={handleClearCache} disabled={clearing || loading}>
                    {clearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    {clearing ? 'Temizleniyor...' : 'Önbelleği Temizle'}
                </Button>
            </CardFooter>
        </Card>
    );
}
