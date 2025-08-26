
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { BarChart, Users, FileText, MoreHorizontal, Trash2, Crown } from "lucide-react";
import { collection, getDocs, query, orderBy, limit, DocumentData, getCountFromServer, deleteDoc, doc, getDoc as getFirestoreDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const StatCard = ({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);


export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ userCount: 0, postCount: 0 });
    const [recentUsers, setRecentUsers] = useState<DocumentData[]>([]);
    const [recentPosts, setRecentPosts] = useState<DocumentData[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats
                const usersCollection = collection(db, "users");
                const postsCollection = collection(db, "posts");
                const userCountSnap = await getCountFromServer(usersCollection);
                const postCountSnap = await getCountFromServer(postsCollection);
                setStats({ 
                    userCount: userCountSnap.data().count, 
                    postCount: postCountSnap.data().count 
                });

                // Fetch recent users
                const usersQuery = query(usersCollection, orderBy("createdAt", "desc"), limit(5));
                const usersSnapshot = await getDocs(usersQuery);
                setRecentUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                
                // Fetch recent posts
                const postsQuery = query(postsCollection, orderBy("createdAt", "desc"), limit(5));
                const postsSnapshot = await getDocs(postsQuery);
                const postsWithUsers = await Promise.all(postsSnapshot.docs.map(async (postDoc) => {
                    const postData = postDoc.data();
                    let user = null;
                    if (postData.authorId) {
                        const userSnap = await getFirestoreDoc(doc(db, "users", postData.authorId));
                        if(userSnap.exists()) {
                            user = userSnap.data();
                        }
                    }
                    return { id: postDoc.id, ...postData, user };
                }))
                setRecentPosts(postsWithUsers);

            } catch (error) {
                console.error("Error fetching admin data: ", error);
                toast({ title: "Veriler alınırken hata oluştu.", variant: "destructive" });
            }
        };

        fetchData();
    }, [toast]);
    
    const handleDeletePost = async (postId: string) => {
        try {
            await deleteDoc(doc(db, "posts", postId));
            setRecentPosts(prev => prev.filter(p => p.id !== postId));
            toast({ title: "Gönderi silindi." });
        } catch (error) {
             toast({ title: "Gönderi silinirken hata oluştu.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Toplam Kullanıcı" 
                    value={stats.userCount.toLocaleString()} 
                    icon={<Users className="h-4 w-4 text-muted-foreground" />} 
                    description="Sisteme kayıtlı toplam kullanıcı"
                />
                <StatCard 
                    title="Toplam Gönderi" 
                    value={stats.postCount.toLocaleString()} 
                    icon={<FileText className="h-4 w-4 text-muted-foreground" />} 
                    description="Paylaşılan toplam gönderi sayısı"
                />
                 <StatCard 
                    title="Aktif Aboneler" 
                    value="N/A" 
                    icon={<Crown className="h-4 w-4 text-muted-foreground" />} 
                    description="Premium abonelikler"
                />
                 <StatCard 
                    title="Gelir (Aylık)" 
                    value="N/A" 
                    icon={<BarChart className="h-4 w-4 text-muted-foreground" />} 
                    description="Bu ayki toplam gelir"
                />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Son Kaydolan Kullanıcılar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kullanıcı</TableHead>
                                    <TableHead>E-posta</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentUsers.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={user.avatarUrl} />
                                                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Son Gönderiler</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Gönderi</TableHead>
                                    <TableHead>Yazar</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentPosts.map(post => (
                                    <TableRow key={post.id}>
                                        <TableCell>
                                            <div className="font-medium truncate max-w-xs">{post.type === 'text' ? post.textContent : post.caption || '[Fotoğraf]'}</div>
                                        </TableCell>
                                        <TableCell>{post.user?.name || 'Bilinmiyor'}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Gönderiyi Sil</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bu gönderiyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeletePost(post.id)} className={cn(buttonVariants({ variant: "destructive" }))}>Sil</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
