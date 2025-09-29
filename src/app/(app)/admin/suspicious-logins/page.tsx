
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, KeyRound, ShieldAlert } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SuspiciousLogin = {
  id: string;
  attemptedPin: string;
  attemptedKey: string;
  photoUrl: string;
  timestamp: Date;
};

export default function SuspiciousLoginsPage() {
    const [logins, setLogins] = useState<SuspiciousLogin[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageToView, setImageToView] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogins = async () => {
            setLoading(true);
            try {
                const loginsQuery = query(collection(db, 'suspicious-logins'), orderBy('timestamp', 'desc'));
                const querySnapshot = await getDocs(loginsQuery);
                const loginsList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        timestamp: (data.timestamp as Timestamp)?.toDate(),
                    } as SuspiciousLogin;
                });
                setLogins(loginsList);
            } catch (error) {
                console.error("Error fetching suspicious logins:", error);
                toast({ variant: 'destructive', title: "Şüpheli giriş kayıtları alınamadı." });
            } finally {
                setLoading(false);
            }
        };
        fetchLogins();
    }, [toast]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Şüpheli Giriş Denemeleri</CardTitle>
                    <CardDescription>
                        Admin paneline yapılan başarısız ve şüpheli giriş denemelerini izleyin.
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
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Denenen PIN</TableHead>
                                    <TableHead>Denenen Anahtar</TableHead>
                                    <TableHead className="text-right">Kanıt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logins.length > 0 ? logins.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell>{format(log.timestamp, "dd MMMM yyyy, HH:mm:ss", { locale: tr })}</TableCell>
                                        <TableCell className="font-mono">{log.attemptedPin || '-'}</TableCell>
                                        <TableCell className="font-mono">{log.attemptedKey || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => setImageToView(log.photoUrl)}>
                                                <Camera className="mr-2 h-4 w-4"/>
                                                Fotoğrafı Gör
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                            Hiç şüpheli giriş denemesi kaydedilmedi.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
             <Dialog open={!!imageToView} onOpenChange={(open) => !open && setImageToView(null)}>
                <DialogContent className="max-w-lg p-0">
                   <DialogHeader className="p-4">
                     <DialogTitle>Giriş Denemesi Kanıtı</DialogTitle>
                   </DialogHeader>
                   {imageToView && (
                      <Image src={imageToView} alt="Şüpheli giriş denemesi fotoğrafı" width={600} height={600} className="object-contain w-full h-auto" />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

