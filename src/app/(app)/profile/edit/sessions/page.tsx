
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Laptop, Smartphone, Monitor, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const sessions = [
  { id: 1, device: 'laptop', name: 'Chrome on macOS', location: 'İstanbul, TR', last_active: 'Şimdi aktif', isCurrent: true },
  { id: 2, device: 'smartphone', name: 'BeMatch iOS App', location: 'İzmir, TR', last_active: '2 saat önce', isCurrent: false },
  { id: 3, device: 'desktop', name: 'Firefox on Windows', location: 'Ankara, TR', last_active: 'Dün', isCurrent: false },
];

const getDeviceIcon = (device: string) => {
    switch (device) {
        case 'laptop': return <Laptop className="w-8 h-8 text-muted-foreground" />;
        case 'smartphone': return <Smartphone className="w-8 h-8 text-muted-foreground" />;
        case 'desktop': return <Monitor className="w-8 h-8 text-muted-foreground" />;
        default: return <Laptop className="w-8 h-8 text-muted-foreground" />;
    }
}

export default function SessionManagementPage() {
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
                    <AlertTitle>Güvenlik Uyarısı</AlertTitle>
                    <AlertDescription>
                        Tanımadığınız bir oturum görürseniz, hemen o oturumu sonlandırın ve şifrenizi değiştirin.
                    </AlertDescription>
                </Alert>
                <div className="space-y-4">
                    {sessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-4">
                                {getDeviceIcon(session.device)}
                                <div className="flex flex-col">
                                    <div className="font-semibold flex items-center gap-2">
                                        {session.name}
                                        {session.isCurrent && <Badge variant="secondary">Mevcut Oturum</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{session.location} - {session.last_active}</p>
                                </div>
                            </div>
                            {!session.isCurrent && <Button variant="destructive" size="sm">Oturumu Kapat</Button>}
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end pt-4">
                    <Button variant="outline">Tüm Diğer Oturumları Kapat</Button>
                </div>
            </CardContent>
        </Card>
    );
}
