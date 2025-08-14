
'use client';

import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Heart, MessageCircle, UserPlus, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formatRelativeTime = (date: Date) => {
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: tr });
};

type Notification = {
  id: string;
  type: 'like' | 'comment' | 'follow';
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
  // New Followers
  { id: 'f1', type: 'follow', user: { name: 'Selin', avatar: 'https://placehold.co/40x40.png', aiHint: 'woman portrait city night' }, read: false, createdAt: new Date(new Date().setHours(new Date().getHours() - 1)) },
  { id: 'f2', type: 'follow', user: { name: 'Mehmet', avatar: 'https://placehold.co/40x40.png', aiHint: 'man portrait' }, read: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 1)) },

  // Likes
  { id: 'l1', type: 'like', user: { name: 'Ahmet', avatar: 'https://placehold.co/40x40.png', aiHint: 'portrait man beach sunset' }, postType: 'photo', read: false, createdAt: new Date(new Date().setMinutes(new Date().getMinutes() - 5)) },
  { id: 'l2', type: 'like', user: { name: 'Zeynep', avatar: 'https://placehold.co/40x40.png', aiHint: 'portrait woman drinking coffee' }, postType: 'photo', read: false, createdAt: new Date(new Date().setHours(new Date().getHours() - 3)) },
  { id: 'l3', type: 'like', user: { name: 'David', avatar: 'https://placehold.co/40x40.png', aiHint: 'man portrait glasses' }, postType: 'text', read: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 2)) },

  // Comments
  { id: 'c1', type: 'comment', user: { name: 'Elif', avatar: 'https://placehold.co/40x40.png', aiHint: 'woman portrait smiling' }, content: 'Harika görünüyor! ✨', postType: 'photo', read: false, createdAt: new Date(new Date().setMinutes(new Date().getMinutes() - 30)) },
  { id: 'c2', type: 'comment', user: { name: 'Can', avatar: 'https://placehold.co/40x40.png', aiHint: 'portrait man professional' }, content: 'Bu konuda kesinlikle haklısın.', postType: 'text', read: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 3)) },
];


const NOTIFICATION_ICONS = {
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
    const { toast } = useToast();

    const groupedNotifications = {
        new: notifications.filter(n => !n.read),
        earlier: notifications.filter(n => n.read),
    };

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        toast({ title: 'Tüm bildirimler okundu olarak işaretlendi.' });
    };

    const handleClearAll = () => {
        setNotifications([]);
        toast({ title: 'Tüm bildirimler temizlendi.', variant: 'destructive' });
    };
    
    const hasUnread = groupedNotifications.new.length > 0;
    
    return (
        <div className="container mx-auto max-w-2xl py-4">
            <div className="flex items-center justify-between mb-4 px-4">
                <h1 className="text-2xl font-bold font-headline">Bildirimler</h1>
                <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={!hasUnread}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Tümünü Oku
                    </Button>
                     <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={notifications.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Temizle
                    </Button>
                </div>
            </div>

            {notifications.length > 0 ? (
                 <Accordion type="multiple" defaultValue={['new', 'earlier']} className="w-full">
                    
                    <AccordionItem value="new" hidden={groupedNotifications.new.length === 0}>
                        <AccordionTrigger className="text-lg font-semibold px-4">
                           <div className='flex items-center gap-2'>
                                <span>Yeni</span>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           {groupedNotifications.new.map(notification => (
                               <NotificationItem key={notification.id} notification={notification} />
                           ))}
                        </AccordionContent>
                    </AccordionItem>
                    
                     <AccordionItem value="earlier" hidden={groupedNotifications.earlier.length === 0}>
                        <AccordionTrigger className="text-lg font-semibold px-4">
                            <div className='flex items-center gap-2'>
                                <span>Daha Eski</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            {groupedNotifications.earlier.map(notification => (
                               <NotificationItem key={notification.id} notification={notification} />
                           ))}
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            ) : (
                <div className="text-center text-muted-foreground py-20">
                    <p className="text-lg">Henüz bildiriminiz yok.</p>
                    <p>Yeni bir etkileşim olduğunda burada görünecek.</p>
                </div>
            )}
        </div>
    );
}

const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div className={cn(
        "flex items-start gap-4 p-4 border-b last:border-b-0 transition-colors",
        !notification.read && "bg-primary/10"
    )}>
        <div className="relative">
            {NOTIFICATION_ICONS[notification.type]}
            {!notification.read && (
                 <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-background" />
            )}
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={notification.user.avatar} data-ai-hint={notification.user.aiHint} />
                    <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm">
                    <span className="font-bold">{notification.user.name}</span>{' '}
                    {getNotificationText(notification)}
                </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(notification.createdAt)}
            </p>
        </div>
    </div>
);
