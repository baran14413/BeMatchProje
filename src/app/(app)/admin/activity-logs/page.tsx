
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Loader2, Laptop, Smartphone, Monitor, MoreVertical, Ban } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { blockIp } from '@/ai/flows/ip-management-flow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ActivityLog = {
  id: string;
  user: {
    uid: string;
    name: string;
    avatarUrl: string;
  };
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  activity: string;
};

const parseUserAgent = (ua: string): { deviceName: string, deviceType: 'laptop' | 'smartphone' | 'desktop' } => {
    if (!ua) return { deviceName: 'Bilinmeyen Cihaz', deviceType: 'desktop' };

    let deviceName = 'Bilinmeyen';
    let deviceType: 'laptop' | 'smartphone' | 'desktop' = 'desktop';

    if (ua.includes('Windows')) deviceName = 'Windows PC';
    else if (ua.includes('Macintosh')) { deviceName = 'Mac'; deviceType = 'laptop'; }
    else if (ua.includes('Linux')) deviceName = 'Linux PC';
    
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        deviceType = 'smartphone';
        if (ua.includes('Android')) deviceName = 'Android Cihazı';
        else if (ua.includes('iPhone')) deviceName = 'iPhone';
        else if (ua.includes('iPad')) deviceName = 'iPad';
    }

    if (ua.includes('Chrome') && !ua.includes('Edg')) deviceName += ' (Chrome)';
    else if (ua.includes('Firefox')) deviceName += ' (Firefox)';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) deviceName += ' (Safari)';
    else if (ua.includes('Edg')) deviceName += ' (Edge)';

    return { deviceName, deviceType };
};

const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
        case 'laptop': return <Laptop className="w-5 h-5 text-muted-foreground" />;
        case 'smartphone': return <Smartphone className="w-5 h-5 text-muted-foreground" />;
        case 'desktop': return <Monitor className="w-5 h-5 text-muted-foreground" />;
        default: return <Laptop className="w-5 h-5 text-muted-foreground" />;
    }
}

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const logsQuery = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'));
                const logsSnapshot = await getDocs(logsQuery);
                const logsList = logsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp.toDate(),
                    } as ActivityLog;
                });
                setLogs(logsList);
            } catch (error) {
                console.error("Error fetching activity logs:", error);
                toast({ variant: 'destructive', title: "Aktivite kayıtları alınamadı." });
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [toast]);

    const handleBlockIp = async (ip: string) => {
        try {
            const result = await blockIp({ ipAddress: ip, reason: 'Admin tarafından engellendi.' });
            if (result.success) {
                toast({ title: `${ip} başarıyla engellendi.` });
            } else {
                throw new Error(result.error || 'Bilinmeyen bir hata.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: "IP Engellenemedi", description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Aktivite Kayıtları</CardTitle>
                <CardDescription>
                    Uygulamadaki son kullanıcı aktivitelerini ve IP adreslerini görüntüleyin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center p-10">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kullanıcı</TableHead>
                                <TableHead>Aktivite</TableHead>
                                <TableHead>IP Adresi</TableHead>
                                <TableHead>Cihaz</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead className="text-right">Eylemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length > 0 ? logs.map(log => {
                                const { deviceName, deviceType } = parseUserAgent(log.userAgent);
                                return (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9">
                                                    {log.user.avatarUrl && <AvatarImage src={log.user.avatarUrl} />}
                                                    <AvatarFallback>{log.user.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{log.user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{log.user.uid.substring(0,10)}...</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{log.activity}</TableCell>
                                        <TableCell>{log.ipAddress}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getDeviceIcon(deviceType)}
                                                <span>{deviceName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(log.timestamp, "dd MMMM yyyy, HH:mm", { locale: tr })}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handleBlockIp(log.ipAddress)}>
                                                        <Ban className="mr-2 h-4 w-4 text-destructive" />
                                                        <span className="text-destructive">IP Adresini Engelle</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                             }) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                        Hiç aktivite kaydı bulunamadı.
                                    </TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
