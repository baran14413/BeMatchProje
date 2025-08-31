
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Package, User, Mail, Link as LinkIcon, FileText } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, DocumentData, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

type PaymentNotification = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageName: string;
  packagePrice: string;
  receiptUrl?: string;
  isCompleted: boolean;
  createdAt: Date;
};

export default function PaymentConfirmationsPage() {
    const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const currentUser = auth.currentUser;

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const notificationsQuery = query(collection(db, 'paymentNotifications'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(notificationsQuery);
                const notificationsList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: (data.createdAt as Timestamp)?.toDate(),
                    } as PaymentNotification;
                });
                setNotifications(notificationsList);
            } catch (error) {
                console.error("Error fetching payment notifications:", error);
                toast({ variant: 'destructive', title: "Ödeme bildirimleri alınamadı." });
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [toast, currentUser]);

    const handleMarkAsCompleted = async (notificationId: string) => {
        try {
            const notificationRef = doc(db, 'paymentNotifications', notificationId);
            await updateDoc(notificationRef, { isCompleted: true });
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isCompleted: true } : n));
            toast({ title: "İşlem Tamamlandı", description: "Bildirim tamamlandı olarak işaretlendi.", className: "bg-green-500 text-white" });
        } catch (error) {
            console.error("Error marking notification as completed:", error);
            toast({ variant: 'destructive', title: "İşaretleme başarısız oldu." });
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Ödeme Onayları</CardTitle>
                <CardDescription>
                    Kullanıcıların premium üyelik için yaptığı ödeme bildirimlerini görüntüleyin ve yönetin.
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
                                <TableHead>Paket</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">Eylemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {notifications.length > 0 ? notifications.map(item => (
                                <TableRow key={item.id} className={item.isCompleted ? 'opacity-50' : ''}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="font-medium flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground"/> {item.userName}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                 <Mail className="w-4 h-4 text-muted-foreground"/> {item.userEmail}
                                            </div>
                                             <div className="text-xs text-muted-foreground mt-1">ID: {item.userId}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-muted-foreground"/>
                                            <div>
                                                <p>{item.packageName}</p>
                                                <p className="font-bold">{item.packagePrice}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{format(item.createdAt, "dd MMMM yyyy, HH:mm", { locale: tr })}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.isCompleted ? 'secondary' : 'default'}>
                                            {item.isCompleted ? 'Tamamlandı' : 'Onay Bekliyor'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {item.receiptUrl && (
                                            <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="sm">
                                                    <FileText className="mr-2 h-4 w-4"/>
                                                    Dekontu Görüntüle
                                                </Button>
                                            </a>
                                        )}
                                        <Link href={`/admin/users`}>
                                            <Button variant="outline" size="sm">
                                                <LinkIcon className="mr-2 h-4 w-4"/>
                                                Kullanıcıya Git
                                            </Button>
                                        </Link>
                                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsCompleted(item.id)} disabled={item.isCompleted}>
                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                                            Tamamlandı İşaretle
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        Henüz ödeme bildirimi yok.
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
