
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserX, Loader2, Trash2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { deleteUserData } from '@/ai/flows/delete-user-data-flow';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type User = {
  id: string; // Use document ID as the unique key
  uid: string;
  name: string;
  avatarUrl: string;
  email: string;
  aiHint?: string;
};

export default function ManageUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                const usersCollection = collection(db, "users");
                const userSnapshot = await getDocs(usersCollection);
                const userList = userSnapshot.docs
                    .map(doc => ({ id: doc.id, ...(doc.data() as Omit<User, 'id'>) }))
                    .filter(user => user.uid !== currentUser.uid); // Filter out the current user
                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users:", error);
                toast({ variant: 'destructive', title: "Kullanıcılar alınamadı." });
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentUser, toast]);
    
    const handleDeleteUser = async (userId: string) => {
        if (!currentUser) return;
        setDeletingId(userId);
        try {
            const result = await deleteUserData({ userId: userId });

            if (result.success) {
                setUsers(prev => prev.filter(u => u.uid !== userId));
                toast({ title: "Kullanıcı başarıyla silindi." });
            } else {
                 throw new Error(result.error || "Bilinmeyen bir hata oluştu.");
            }
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast({ variant: 'destructive', title: "Kullanıcı silinirken hata oluştu.", description: error.message });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kullanıcıları Yönet</CardTitle>
                <CardDescription>
                    Sistemdeki tüm kullanıcıları görüntüleyin ve yönetin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center p-10">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : users.length > 0 ? (
                     <div className="space-y-4">
                        {users.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl} data-ai-hint={user.aiHint} />
                                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={deletingId === user.uid}>
                                            {deletingId === user.uid ? (
                                                <Loader2 className="w-4 h-4 animate-spin"/>
                                            ) : (
                                                <Trash2 className="w-4 h-4"/>
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Bu kullanıcıyı ve tüm verilerini (gönderiler, sohbetler vb.) kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => handleDeleteUser(user.uid)} 
                                                className={cn(buttonVariants({variant: "destructive"}))}
                                                disabled={deletingId !== null}
                                            >
                                                Evet, Sil
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10 border-2 border-dashed rounded-lg">
                        <UserX className="w-12 h-12 mb-4" />
                        <h3 className="text-lg font-semibold">Sizden Başka Kullanıcı Yok</h3>
                        <p className="text-sm">Sisteme yeni bir kullanıcı katıldığında burada görünecektir.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
