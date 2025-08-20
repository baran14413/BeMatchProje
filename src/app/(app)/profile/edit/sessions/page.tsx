
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Laptop, Smartphone, Monitor, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type SessionInfo = {
    deviceName: string;
    lastSignInTime: string;
    creationTime: string;
    deviceType: 'laptop' | 'smartphone' | 'desktop';
};

const getDeviceIcon = (device: string) => {
    switch (device) {
        case 'laptop': return <Laptop className="w-8 h-8 text-muted-foreground" />;
        case 'smartphone': return <Smartphone className="w-8 h-8 text-muted-foreground" />;
        case 'desktop': return <Monitor className="w-8 h-8 text-muted-foreground" />;
        default: return <Laptop className="w-8 h-8 text-muted-foreground" />;
    }
}

// Basic parser for user agent string
const parseUserAgent = (ua: string): { deviceName: string, deviceType: 'laptop' | 'smartphone' | 'desktop' } => {
    if (!ua) return { deviceName: 'Bilinmeyen Cihaz', deviceType: 'desktop' };

    let deviceName = 'Bilinmeyen Cihaz';
    let deviceType: 'laptop' | 'smartphone' | 'desktop' = 'desktop';

    // OS detection
    if (ua.includes('Windows')) deviceName = 'Windows PC';
    if (ua.includes('Macintosh')) {
        deviceName = 'Mac';
        deviceType = 'laptop';
    }
    if (ua.includes('Linux')) deviceName = 'Linux PC';
    
    // Browser detection
    if (ua.includes('Chrome') && !ua.includes('Edg')) deviceName = `Chrome on ${deviceName}`;
    if (ua.includes('Firefox')) deviceName = `Firefox on ${deviceName}`;
    if (ua.includes('Safari') && !ua.includes('Chrome')) deviceName = `Safari on ${deviceName}`;
    if (ua.includes('Edg')) deviceName = `Edge on ${deviceName}`;
    
    // Mobile detection
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        deviceType = 'smartphone';
        if (ua.includes('Android')) deviceName = 'Android Cihazı';
        if (ua.includes('iPhone')) deviceName = 'iPhone';
        if (ua.includes('iPad')) deviceName = 'iPad';
    }

    return { deviceName, deviceType };
};


export default function SessionManagementPage() {
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const { deviceName, deviceType } = parseUserAgent(navigator.userAgent);
            
            const lastSignIn = currentUser.metadata.lastSignInTime 
                ? format(new Date(currentUser.metadata.lastSignInTime), "dd MMMM yyyy, HH:mm", { locale: tr })
                : 'Bilinmiyor';
            
            const creation = currentUser.metadata.creationTime
                ? format(new Date(currentUser.metadata.creationTime), "dd MMMM yyyy", { locale: tr })
                : 'Bilinmiyor';
                
            setSession({
                deviceName: deviceName,
                deviceType: deviceType,
                lastSignInTime: lastSignIn,
                creationTime: creation
            });
        }
        setLoading(false);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Oturum Yönetimi</CardTitle>
                <CardDescription>
                    Hesabınıza giriş yapılan aktif oturumları görüntüleyin ve yönetin.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Güvenlik Bilgisi</AlertTitle>
                    <AlertDescription>
                       Bu sayfada yalnızca mevcut oturumunuzun bilgilerini görebilirsiniz. Diğer cihazlardaki oturumları sonlandırmak için şifrenizi değiştirmeniz önerilir.
                    </AlertDescription>
                </Alert>
                <div className="space-y-4">
                     {loading ? (
                         <div className="flex justify-center items-center p-10">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                     ) : session ? (
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-4">
                                {getDeviceIcon(session.deviceType)}
                                <div className="flex flex-col">
                                    <div className="font-semibold flex items-center gap-2">
                                        {session.deviceName}
                                        <Badge variant="secondary">Mevcut Oturum</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Son giriş: {session.lastSignInTime}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Hesap oluşturma: {session.creationTime}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <p className="text-center text-muted-foreground p-4">Oturum bilgileri yüklenemedi.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
