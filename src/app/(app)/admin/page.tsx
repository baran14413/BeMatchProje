
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, FileImage, UserPlus, Flag, MoreVertical } from "lucide-react";
import { collection, getCountFromServer, query, orderBy, limit, getDocs, doc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";

const formatRelativeTime = (date: Date | null) => {
    if (!date) return '';
    try {
        return formatDistanceToNowStrict(date, {
            addSuffix: true,
            locale: tr,
        });
    } catch (e) {
        return 'az önce';
    }
};

const StatCard = ({ title, value, icon, iconBgColor }: { title: string, value: string, icon: React.ReactNode, iconBgColor: string }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
            <div className="text-4xl font-bold">{value}</div>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", iconBgColor)}>
                {icon}
            </div>
        </CardContent>
    </Card>
);

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ userCount: 0, postCount: 0, newUsers: 0, reportedPosts: 0 });
    const [recentUsers, setRecentUsers] = useState<DocumentData[]>([]);
    const [recentPosts, setRecentPosts] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch stats
                const usersCollection = collection(db, "users");
                const postsCollection = collection(db, "posts");
                
                const userCountSnap = await getCountFromServer(usersCollection);
                const postCountSnap = await getCountFromServer(postsCollection);
                
                setStats({ 
                    userCount: userCountSnap.data().count, 
                    postCount: postCountSnap.data().count,
                    newUsers: 215, // Mock
                    reportedPosts: 45, // Mock
                });

                // Fetch recent users
                const recentUsersQuery = query(usersCollection, orderBy("createdAt", "desc"), limit(5));
                const recentUsersSnapshot = await getDocs(recentUsersQuery);
                setRecentUsers(recentUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                
                // Fetch recent posts
                const recentPostsQuery = query(postsCollection, orderBy("createdAt", "desc"), limit(5));
                const postsSnapshot = await getDocs(recentPostsQuery);

                const authorIds = [...new Set(postsSnapshot.docs.map(p => p.data().authorId).filter(id => !!id))];
                const authorsData: Record<string, DocumentData> = {};
                
                if(authorIds.length > 0) {
                    const authorsQuery = query(collection(db, 'users'), where('uid', 'in', authorIds));
                    const authorsSnapshot = await getDocs(authorsQuery);
                    authorsSnapshot.forEach(doc => {
                        authorsData[doc.id] = { ...doc.data(), uid: doc.id };
                    });
                }
                
                const postsWithUsers = postsSnapshot.docs.map(postDoc => {
                    const postData = postDoc.data();
                    const author = authorsData[postData.authorId];
                    return { id: postDoc.id, ...postData, user: author || { name: "Bilinmiyor"} };
                });
                
                setRecentPosts(postsWithUsers);

            } catch (error) {
                console.error("Error fetching admin data: ", error);
                toast({ title: "Yönetim paneli verileri alınırken hata oluştu.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    return (
        <div className="space-y-6">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Toplam Kullanıcılar" 
                    value={stats.userCount.toLocaleString()} 
                    icon={<Users className="h-6 w-6 text-blue-600" />} 
                    iconBgColor="bg-blue-100 dark:bg-blue-900/20"
                />
                <StatCard 
                    title="Toplam Gönderiler" 
                    value={stats.postCount.toLocaleString()} 
                    icon={<FileImage className="h-6 w-6 text-green-600" />} 
                    iconBgColor="bg-green-100 dark:bg-green-900/20"
                />
                 <StatCard 
                    title="Yeni Kayıtlar" 
                    value={stats.newUsers.toLocaleString()} 
                    icon={<UserPlus className="h-6 w-6 text-yellow-600" />} 
                    iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
                />
                 <StatCard 
                    title="Rapor Edilenler" 
                    value={stats.reportedPosts.toLocaleString()}
                    icon={<Flag className="h-6 w-6 text-red-600" />} 
                    iconBgColor="bg-red-100 dark:bg-red-900/20"
                />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Son Kayıt Olan Kullanıcılar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? ( <p>Yükleniyor...</p> ) : recentUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between">
                                <Link href={`/profile/${user.username}`} className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </Link>
                                <Badge variant={user.isOnline ? "default" : "secondary"} className={cn(user.isOnline && "bg-green-500 hover:bg-green-500/90")}>
                                    {user.isOnline ? 'Aktif' : 'Pasif'}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Son Gönderiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {loading ? ( <p>Yükleniyor...</p> ) : recentPosts.map(post => (
                            <div key={post.id} className="flex items-start gap-4">
                               {post.type === 'photo' ? (
                                    <Image src={post.url} width={48} height={48} alt="Post image" className="w-12 h-12 rounded-md object-cover" />
                               ) : (
                                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                        <FileImage className="w-6 h-6 text-muted-foreground" />
                                    </div>
                               )}
                               <div className="flex-1">
                                   <p className="font-semibold leading-tight truncate">{post.caption || post.textContent}</p>
                                   <p className="text-sm text-muted-foreground mt-1">
                                        {formatRelativeTime(post.createdAt?.toDate())} - {post.user?.name}
                                   </p>
                               </div>
                                <Link href="#" className={cn(buttonVariants({variant: "ghost", size:"icon"}), "h-8 w-8")}>
                                    <MoreVertical />
                                </Link>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
