
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Ban, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, DocumentData, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { unblockIp } from '@/ai/flows/ip-management-flow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type BlockedIp = {
  ip: string;
  reason: string;
  blockedAt: Date | null;
};

export default function BlockedIpsPage() {
    const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchBlockedIps = async () => {
            setLoading(true);
            try {
                const ipsQuery = query(collection(db, 'blocked-ips'), orderBy('blockedAt', 'desc'));
                const ipsSnapshot = await getDocs(ipsQuery);
                const ipsList = ipsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        ip: doc.id,
                        reason: data.reason,
                        blockedAt: (data.blockedAt as Timestamp)?.toDate() || null,
                    };
                });
                setBlockedIps(ipsList);
            } catch (error) {
                console.error("Error fetching blocked IPs:", error);
                toast({ variant: 'destructive', title: "Engellenen IP'ler alınamadı." });
            } finally {
                setLoading(false);
            }
        };
        fetchBlockedIps();
    }, [toast]);

    const handleUnblock = async (ipAddress: string) => {
        try {
            const result = await unblockIp({ ipAddress });
            if (result.success) {
                toast({ title: `${ipAddress} adresinin engeli kaldırıldı.` });
                setBlockedIps(prev => prev.filter(ip => ip.ip !== ipAddress));
            } else {
                throw new Error(result.error || 'Bilinmeyen bir hata.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Engel Kaldırılamadı', description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Engellenen IP Adresleri</CardTitle>
                <CardDescription>
                    Uygulamaya erişimi engellenen IP adreslerini yönetin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center p-10">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>IP Adresi</TableHead>
                                <TableHead>Engellenme Nedeni</TableHead>
                                <TableHead>Engellenme Tarihi</TableHead>
                                <TableHead className="text-right">Eylemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {blockedIps.length > 0 ? blockedIps.map(blocked => (
                                <TableRow key={blocked.ip}>
                                    <TableCell className="font-mono">{blocked.ip}</TableCell>
                                    <TableCell>{blocked.reason}</TableCell>
                                    <TableCell>
                                        {blocked.blockedAt ? format(blocked.blockedAt, "dd MMMM yyyy, HH:mm", { locale: tr }) : 'Bilinmiyor'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                 <Button variant="outline" size="sm">
                                                    <ShieldCheck className="mr-2 h-4 w-4 text-green-600"/>
                                                    Engeli Kaldır
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        <b>{blocked.ip}</b> adresinin engelini kaldırmak istediğinizden emin misiniz? Bu IP adresi tekrar uygulamaya erişebilecektir.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => handleUnblock(blocked.ip)} 
                                                        className={cn(buttonVariants({ variant: "default" }))}>
                                                        Evet, Engeli Kaldır
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        Hiç engellenmiş IP adresi bulunamadı.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
