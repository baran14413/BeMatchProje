
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, FileImage, UserPlus, Flag } from "lucide-react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const StatCard = ({ title, value, icon, description, iconBgColor }: { title: string, value: string, icon: React.ReactNode, description: string, iconBgColor: string }) => (
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
    const { toast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const usersCollection = collection(db, "users");
                const postsCollection = collection(db, "posts");
                
                const userCountSnap = await getCountFromServer(usersCollection);
                const postCountSnap = await getCountFromServer(postsCollection);
                
                setStats({ 
                    userCount: userCountSnap.data().count, 
                    postCount: postCountSnap.data().count,
                    // Mock data for other stats as they are not in the db
                    newUsers: 215,
                    reportedPosts: 45,
                });

            } catch (error) {
                console.error("Error fetching admin data: ", error);
                toast({ title: "İstatistikler alınırken hata oluştu.", variant: "destructive" });
            }
        };

        fetchStats();
    }, [toast]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard</h2>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Toplam Kullanıcılar" 
                    value={stats.userCount.toLocaleString()} 
                    icon={<Users className="h-6 w-6 text-blue-600" />} 
                    description="Tüm zamanlar"
                    iconBgColor="bg-blue-100 dark:bg-blue-900/20"
                />
                <StatCard 
                    title="Toplam Gönderiler" 
                    value={stats.postCount.toLocaleString()} 
                    icon={<FileImage className="h-6 w-6 text-green-600" />} 
                    description="Tüm zamanlar"
                     iconBgColor="bg-green-100 dark:bg-green-900/20"
                />
                 <StatCard 
                    title="Yeni Kayıtlar" 
                    value={stats.newUsers.toLocaleString()} 
                    icon={<UserPlus className="h-6 w-6 text-yellow-600" />} 
                    description="Son 30 gün"
                    iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
                />
                 <StatCard 
                    title="Rapor Edilen Gönderiler" 
                    value={stats.reportedPosts.toLocaleString()}
                    icon={<Flag className="h-6 w-6 text-red-600" />} 
                    description="İnceleme bekliyor"
                    iconBgColor="bg-red-100 dark:bg-red-900/20"
                />
            </div>
        </div>
    );
}
