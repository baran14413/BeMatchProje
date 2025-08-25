
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserX, Loader2, Trash2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteUserData } from '@/ai/flows/delete-user-data-flow';
import { cn } from '@/lib/utils';
import { User } from 'firebase/auth';

type AppUser = {
  uid: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  aiHint?: string;
};

export default function ManageUsersPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersList = usersSnapshot.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data()
                } as AppUser));
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users:", error);
                toast({ variant: 'destructive', title: "Kullanıcılar alınamadı." });
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [toast]);
    
    const handleDeleteUser = async (userIdToDelete: string) => {
        const originalUsers = [...users];
        setUsers(prev => prev.filter(u => u.uid !== userIdToDelete));

        try {
            const result = await deleteUserData({ userId: userIdToDelete });
            if (result.success) {
                toast({ title: "Kullanıcı başarıyla silindi." });
            } else {
                 setUsers(originalUsers);
                 throw new Error(result.error || "Bilinmeyen bir hata oluştu.");
            }
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast({ variant: 'destructive', title: 'Kullanıcı silinemedi.', description: error.message });
            setUsers(originalUsers);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kullanıcıları Yönet</CardTitle>
                <CardDescription>
                    Sistemdeki tüm kullanıcıları görüntüleyin ve yönetin. Bu işlem geri alınamaz.
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
                            <div key={user.uid} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
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
                                        <Button variant="destructive" size="sm" disabled={user.uid === currentUser?.uid}>
                                            <Trash2 className="mr-2 h-4 w-4"/>
                                            Sil
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                <b>{user.name}</b> adlı kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem, kullanıcının tüm gönderilerini, sohbetlerini ve diğer verilerini silecektir. Bu işlem geri alınamaz.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => handleDeleteUser(user.uid)} 
                                                className={cn(buttonVariants({ variant: "destructive" }))}>
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
                        <h3 className="text-lg font-semibold">Sistemde Kullanıcı Yok</h3>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
