
'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, DocumentData, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteUser } from '@/ai/flows/delete-user-flow';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type User = DocumentData & {
  id: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as User))
          .filter(user => user.id !== currentUser?.uid); // Exclude current admin
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({ variant: 'destructive', title: "Kullanıcılar getirilirken bir hata oluştu." });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [toast, currentUser]);

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      const result = await deleteUser({ userId });
      if (result.success) {
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        toast({ title: "Kullanıcı Silindi", description: result.message, className: 'bg-green-500 text-white' });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({ variant: 'destructive', title: "Kullanıcı silinemedi.", description: error.message });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Yönetimi</CardTitle>
          <CardDescription>Uygulamadaki tüm kullanıcıları görüntüleyin ve yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <Link href={`/profile/${user.username}`} className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" disabled={deletingUserId === user.id}>
                        {deletingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Kullanıcıyı Silmek Üzeresiniz!</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu işlem geri alınamaz. <span className="font-bold">{user.name} (@{user.username})</span> adlı kullanıcıya ait tüm gönderiler, sohbetler, yorumlar ve profil bilgileri kalıcı olarak silinecektir. Emin misiniz?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          className={cn(buttonVariants({ variant: "destructive" }))}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Evet, Kullanıcıyı Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
