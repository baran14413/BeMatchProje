
'use client';

import { useState, useMemo } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formatRelativeTime = (date: Date) => {
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: tr });
};

type NotificationType = 'like' | 'comment' | 'follow';

type Notification = {
  id: string;
  type: NotificationType;
  user: {
    name: string;
    avatar: string;
    aiHint: string;
  };
  content?: string; // For comments
  postType?: 'photo' | 'text'; // For likes/comments
  read: boolean;
  createdAt: Date;
};

const initialNotifications: Notification[] = [
  { id: 'f1', type: 'follow', user: { name: 'Selin', avatar: 'https://placehold.co/40x40.png', aiHint: 'woman portrait city night' }, read: false, createdAt: new Date(new Date().setHours(new Date().getHours() - 1)) },
  { id: 'l1', type: 'like', user: { name: 'Ahmet', avatar: 'https://placehold.co/40x40.png', aiHint: 'portrait man beach sunset' }, postType: 'photo', read: false, createdAt: new Date(new Date().setMinutes(new Date().getMinutes() - 5)) },
  { id: 'c1', type: 'comment', user: { name: 'Elif', avatar: 'https://placehold.co/40x40.png', aiHint: 'woman portrait smiling' }, content: 'Harika görünüyor! ✨', postType: 'photo', read: false, createdAt: new Date(new Date().setMinutes(new Date().getMinutes() - 30)) },
  { id: 'l2', type: 'like', user: { name: 'Zeynep', avatar: 'https://placehold.co/40x40.png', aiHint: 'portrait woman drinking coffee' }, postType: 'photo', read: false, createdAt: new Date(new Date().setHours(new Date().getHours() - 3)) },
  { id: 'f2', type: 'follow', user: { name: 'Mehmet', avatar: 'https://placehold.co/40x40.png', aiHint: 'man portrait' }, read: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 1)) },
  { id: 'l3', type: 'like', user: { name: 'David', avatar: 'https://placehold.co/40x40.png', aiHint: 'man portrait glasses' }, postType: 'text', read: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 2)) },
  { id: 'c2', type: 'comment', user: { name: 'Can', avatar: 'https://placehold.co/40x40.png', aiHint: 'portrait man professional' }, content: 'Bu konuda kesinlikle haklısın.', postType: 'text', read: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 3)) },
];

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  follow: <UserPlus className="h-6 w-6 text-blue-500" />,
  like: <Heart className="h-6 w-6 text-red-500" />,
  comment: <MessageCircle className="h-6 w-6 text-green-500" />,
};

const getNotificationText = (notification: Notification): string => {
  switch (notification.type) {
    case 'follow':
      return 'seni takip etmeye başladı.';
    case 'like':
      return `senin bir ${notification.postType === 'photo' ? 'fotoğrafını' : 'gönderini'} beğendi.`;
    case 'comment':
      return `senin bir ${notification.postType === 'photo' ? 'fotoğrafına' : 'gönderine'} yorum yaptı: "${notification.content}"`;
    default:
      return '';
  }
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [activeTab, setActiveTab] = useState<NotificationType | 'all'>('all');
    const { toast } = useToast();
    
    const hasUnread = useMemo(() => notifications.some(n => !n.read), [notifications]);

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        toast({ title: 'Tüm bildirimler okundu olarak işaretlendi.' });
    };

    const handleClearAll = () => {
        setNotifications([]);
        toast({ title: 'Tüm bildirimler temizlendi.', variant: 'destructive' });
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
    ];

    return (
        <div className="container mx-auto max-w-2xl py-4 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4 px-4">
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={!hasUnread}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Tümünü Oku
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={notifications.length === 0} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Temizle
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NotificationType | 'all')} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto">
                    {TABS.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            
            <div className="flex-1 overflow-y-auto mt-4">
                 {filteredNotifications.length > 0 ? (
                    <div className="flex flex-col">
                        {filteredNotifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-20 flex flex-col items-center justify-center">
                        <p className="text-lg">Bu kategoride bildirim yok.</p>
                        <p className="text-sm">Yeni bir etkileşim olduğunda burada görünecek.</p>
                    </div>
                )}
            </div>

        </div>
    );
}

const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div className={cn(
        "flex items-start gap-4 p-4 border-b last:border-b-0 transition-colors",
        !notification.read && "bg-primary/5"
    )}>
        <div className="relative">
            {NOTIFICATION_ICONS[notification.type]}
            {!notification.read && (
                 <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-blue-500" />
            )}
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={notification.user.avatar} data-ai-hint={notification.user.aiHint} />
                    <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm">
                    <span className="font-semibold">{notification.user.name}</span>{' '}
                    {getNotificationText(notification)}
                </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(notification.createdAt)}
            </p>
        </div>
    </div>
);
