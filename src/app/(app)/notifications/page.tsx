
'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck, Trash2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';


const formatRelativeTime = (date: Date) => {
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: tr });
};

type NotificationType = 'like' | 'comment' | 'follow' | 'gallery_request';

type Notification = {
  id: string;
  type: NotificationType;
  fromUser: {
    name: string;
    avatar: string;
    aiHint: string;
  };
  content?: string; // For comments
  postType?: 'photo' | 'text'; // For likes/comments
  read: boolean;
  createdAt: Date;
};

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  follow: <UserPlus className="h-6 w-6 text-blue-500" />,
  like: <Heart className="h-6 w-6 text-red-500" />,
  comment: <MessageCircle className="h-6 w-6 text-green-500" />,
  gallery_request: <Lock className="h-6 w-6 text-purple-500" />,
};

const getNotificationText = (notification: Notification): string => {
  switch (notification.type) {
    case 'follow':
      return 'seni takip etmeye başladı.';
    case 'like':
      return `senin bir ${notification.postType === 'photo' ? 'fotoğrafını' : 'gönderini'} beğendi.`;
    case 'comment':
      return `senin bir ${notification.postType === 'photo' ? 'fotoğrafına' : 'gönderine'} yorum yaptı: "${notification.content}"`;
    case 'gallery_request':
        return 'gizli galerini görmek için izin istedi.';
    default:
      return '';
  }
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<NotificationType | 'all'>('all');
    const { toast } = useToast();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'notifications'), 
            where('recipientId', '==', currentUser.uid), 
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(),
            })) as Notification[];
            setNotifications(fetchedNotifications);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            toast({ variant: 'destructive', title: "Bildirimler alınamadı." });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, toast]);
    
    const hasUnread = useMemo(() => notifications.some(n => !n.read), [notifications]);

    const handleMarkAllRead = async () => {
        if (!currentUser) return;
        const batch = writeBatch(db);
        const unreadNotifs = notifications.filter(n => !n.read);
        unreadNotifs.forEach(notif => {
            const notifRef = doc(db, 'notifications', notif.id);
            batch.update(notifRef, { read: true });
        });
        try {
            await batch.commit();
            toast({ title: 'Tüm bildirimler okundu olarak işaretlendi.' });
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast({ variant: 'destructive', title: "Bir hata oluştu." });
        }
    };

    const handleClearAll = async () => {
         if (!currentUser) return;
        const batch = writeBatch(db);
        notifications.forEach(notif => {
            const notifRef = doc(db, 'notifications', notif.id);
            batch.delete(notifRef);
        });
        try {
            await batch.commit();
            toast({ title: 'Tüm bildirimler temizlendi.', variant: 'destructive' });
        } catch (error) {
            console.error("Error clearing notifications:", error);
            toast({ variant: 'destructive', title: "Bildirimler temizlenirken bir hata oluştu." });
        }
    };

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'all') {
            return notifications;
        }
        return notifications.filter(n => n.type === activeTab);
    }, [notifications, activeTab]);
    
    const TABS: { id: NotificationType | 'all', label: string }[] = [
        { id: 'all', label: 'Tümü' },
        { id: 'follow', label: 'Takip' },
        { id: 'like', label: 'Beğeni' },
        { id: 'comment', label: 'Yorum' },
        { id: 'gallery_request', label: 'İstekler'}
    ];

    return (
        <div className="container mx-auto max-w-2xl py-4 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4 px-4">
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={!hasUnread || loading}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Tümünü Oku
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={notifications.length === 0 || loading} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Temizle
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NotificationType | 'all')} className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-auto">
                    {TABS.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            
            <div className="flex-1 overflow-y-auto mt-4">
                 {loading ? (
                    <div className="p-4 space-y-4">
                         {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : filteredNotifications.length > 0 ? (
                    <div className="flex flex-col">
                        {filteredNotifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-20 flex flex-col items-center justify-center">
                        <Bell className="w-12 h-12 mb-4 text-muted-foreground/50"/>
                        <p className="text-lg">Bu kategoride bildirim yok.</p>
                        <p className="text-sm">Yeni bir etkileşim olduğunda burada görünecek.</p>
                    </div>
                )}
            </div>

        </div>
    );
}

const NotificationItem = ({ notification }: { notification: Notification }) => {
    const { toast } = useToast();

    const handlePermission = (permissionType: 'temporary' | 'permanent' | 'declined') => {
        // TODO: Implement Firestore logic to update permissions
        let title = '';
        switch(permissionType) {
            case 'temporary': title = '24 saatlik izin verildi.'; break;
            case 'permanent': title = 'Kalıcı izin verildi.'; break;
            case 'declined': title = 'İstek reddedildi.'; break;
        }
        toast({ title });
        // TODO: Optionally, delete the notification after action
    };

    return (
        <div className={cn(
            "flex flex-col gap-4 p-4 border-b last:border-b-0 transition-colors",
            !notification.read && "bg-primary/5"
        )}>
            <div className="flex items-start gap-4">
                <div className="relative">
                    {NOTIFICATION_ICONS[notification.type]}
                    {!notification.read && (
                         <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-blue-500" />
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={notification.fromUser.avatar} data-ai-hint={notification.fromUser.aiHint} />
                            <AvatarFallback>{notification.fromUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm">
                            <span className="font-semibold">{notification.fromUser.name}</span>{' '}
                            {getNotificationText(notification)}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.createdAt)}
                    </p>
                </div>
            </div>
            {notification.type === 'gallery_request' && (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="destructive" onClick={() => handlePermission('declined')}>Reddet</Button>
                    <Button size="sm" variant="outline" onClick={() => handlePermission('temporary')}>24 Saat İzin Ver</Button>
                    <Button size="sm" onClick={() => handlePermission('permanent')}>Sürekli İzin Ver</Button>
                </div>
            )}
        </div>
    );
};

    