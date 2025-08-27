
'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, Heart, Loader2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

type NotificationType = 'follow' | 'like' | 'comment' | 'gallery_request' | 'login_alert';

type Notification = {
  id: string;
  type: NotificationType;
  fromUser: {
    uid: string;
    name: string;
    avatar: string;
  };
  content?: string;
  postId?: string;
  postType?: 'photo' | 'text';
  read: boolean;
  createdAt: Timestamp;
};

const formatRelativeTime = (date: Date | null) => {
    if (!date) return '';
    try {
        return formatDistanceToNowStrict(date, { addSuffix: true, locale: tr });
    } catch (e) {
        return 'az önce';
    }
};

const NotificationIcon = ({ notification }: { notification: Notification }) => {
    const { fromUser, type } = notification;

    const baseClasses = "w-12 h-12 border-2";

    switch (type) {
        case 'like':
        case 'comment':
            return (
                <div className="relative w-12 h-12">
                    <Avatar className="w-9 h-9 absolute top-0 left-0 z-10 border-2 border-background">
                        {fromUser.avatar ? <AvatarImage src={fromUser.avatar} /> : <AvatarFallback>{fromUser.name.charAt(0)}</AvatarFallback>}
                    </Avatar>
                     <div className="w-7 h-7 absolute bottom-0 right-0 z-20 rounded-full bg-red-500 flex items-center justify-center border-2 border-background">
                        <Heart className="w-4 h-4 text-white fill-white"/>
                    </div>
                </div>
            )
        case 'follow':
        case 'gallery_request':
        default:
             return (
                <Avatar className={cn(baseClasses, 'border-transparent')}>
                    {fromUser.avatar ? <AvatarImage src={fromUser.avatar} /> : <AvatarFallback>{fromUser.name.charAt(0)}</AvatarFallback>}
                </Avatar>
            );
    }
}


const NotificationText = ({ notification }: { notification: Notification }) => {
    const { type, fromUser, content } = notification;

    const formatText = (text: string) => {
        return (
            <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        );
    }

    let text = '';
    switch (type) {
        case 'follow':
            text = `**${fromUser.name}** seni takip etmeye başladı.`;
            break;
        case 'like':
            text = `**${fromUser.name}** bir gönderini beğendi.`;
            break;
        case 'comment':
            text = `**${fromUser.name}** gönderine yorum yaptı: "${content}"`;
            break;
        case 'gallery_request':
             text = `**${fromUser.name}** gizli galerini görmek için istek gönderdi.`;
             break;
        default:
            text = 'Yeni bir bildiriminiz var.';
    }

    return (
        <p className="text-sm">
            {formatText(text)}
            <span className="text-muted-foreground ml-1.5">{formatRelativeTime(notification.createdAt?.toDate())}</span>
        </p>
    )
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
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

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedNotifications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notification));
            setNotifications(fetchedNotifications);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications: ", error);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [currentUser]);
    
    const getNotificationLink = (notification: Notification) => {
        switch (notification.type) {
            case 'like':
            case 'comment':
                return `/post/${notification.postId}`;
            case 'follow':
            case 'gallery_request':
                return `/profile/${notification.fromUser.name}`; // Assuming username is same as name for now
            default:
                return '#';
        }
    };


    return (
        <div className="bg-background h-full flex flex-col">
            <header className="flex items-center justify-between p-4 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-bold">Bildirimler</h1>
                <Button variant="link" className="text-primary p-0">Filtrele</Button>
            </header>
            
            <main className="flex-1 overflow-y-auto">
                {loading ? (
                     <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : notifications.length > 0 ? (
                     <div>
                        {notifications.map((item) => (
                           <Link href={getNotificationLink(item)} key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors">
                                <div className="shrink-0">
                                    <NotificationIcon notification={item} />
                                </div>
                                <div className="flex-1">
                                    <NotificationText notification={item} />
                                </div>
                                 <div className="shrink-0">
                                    {item.type === 'follow' && <Button size="sm">Takip Et</Button>}
                                    {item.type === 'gallery_request' && <Button size="sm">İsteği Gör</Button>}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-4">
                        <Bell className="w-16 h-16 mb-4 text-muted-foreground/50" />
                        <h3 className="text-xl font-bold">Henüz bildiriminiz yok.</h3>
                        <p className="text-sm">Yeni bir etkileşim olduğunda burada görünecek.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
