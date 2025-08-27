
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, UserPlus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type NotificationType = 'follow' | 'like' | 'comment' | 'suggestion' | 'login_alert' | 'post';

type MockNotification = {
  id: string;
  type: NotificationType;
  users: { name: string; avatarUrl?: string; hasStory?: boolean }[];
  text: string;
  timestamp: string;
  thumbnailUrl?: string;
  action?: 'follow' | 'following';
};

// Mock data based on the screenshot provided
const mockNotifications: MockNotification[] = [
    {
        id: '1',
        type: 'suggestion',
        users: [{ name: 'nazz._24', avatarUrl: 'https://picsum.photos/id/1011/100/100', hasStory: false }],
        text: 'Yeni takip önerisi: **nazz._24**. 4 ortak bağlantınız var.',
        timestamp: '5g',
        action: 'follow',
    },
    {
        id: '2',
        type: 'comment',
        users: [{ name: 'ecemtaser', avatarUrl: 'https://picsum.photos/id/1027/100/100', hasStory: false }],
        text: "**ecemtaser**'in anketinin en son sonuçları",
        timestamp: '6g',
        thumbnailUrl: 'https://picsum.photos/id/103/100/100',
    },
    {
        id: '3',
        type: 'login_alert',
        users: [],
        text: 'Tanınmayan bir **XiaoMi Redmi Note 9S** az önce Ankara, Turkey, TR yakınında giriş yaptı',
        timestamp: '1h',
        thumbnailUrl: '/images/ankara-map.png',
    },
    {
        id: '4',
        type: 'follow',
        users: [{ name: 'akkoyun.serkan', avatarUrl: 'https://picsum.photos/id/237/100/100', hasStory: false }],
        text: '**akkoyun.serkan** seni takip etmeye başladı.',
        timestamp: '1h',
        action: 'following',
    },
    {
        id: '5',
        type: 'post',
        users: [{ name: 'mkyazicioglutr', avatarUrl: 'https://picsum.photos/id/3/100/100', hasStory: true }],
        text: '**mkyazicioglutr** bir fotoğraf paylaştı.',
        timestamp: '1h',
        thumbnailUrl: 'https://picsum.photos/id/1999/100/100',
    },
    {
        id: '6',
        type: 'like',
        users: [
            { name: 'opsarozlusoylu', avatarUrl: 'https://picsum.photos/id/4/100/100', hasStory: false },
            { name: 'nagis06_', avatarUrl: 'https://picsum.photos/id/5/100/100', hasStory: false },
            { name: 'beyhangngrd', avatarUrl: 'https://picsum.photos/id/6/100/100', hasStory: false }
        ],
        text: '**opsarozlusoylu**, **nagis06_** ve **beyhangngrd** senin yorumunu beğendi: @sahinarslan09 yıllardır her yağmurda... devamı',
        timestamp: '1h',
        thumbnailUrl: 'https://picsum.photos/id/10/100/100',
    },
    {
        id: '7',
        type: 'follow',
        users: [{ name: 'savas_0921', avatarUrl: 'https://picsum.photos/id/7/100/100', hasStory: false }],
        text: '**savas_0921** seni takip etmeye başladı.',
        timestamp: '1h',
        action: 'follow',
    },
    {
        id: '8',
        type: 'follow',
        users: [{ name: 'kykzn.hasan2', avatarUrl: 'https://picsum.photos/id/8/100/100', hasStory: false }],
        text: '**kykzn.hasan2** seni takip etmeye başladı.',
        timestamp: '1h',
        action: 'follow',
    },
    {
        id: '9',
        type: 'follow',
        users: [{ name: 'eeylulw_32', avatarUrl: '', hasStory: false }],
        text: '**eeylulw_32** ve 4 diğer kişi seni takip ediyor ancak sen onları takip etmiyorsun.',
        timestamp: '1h',
    },
];

const renderIcon = (item: MockNotification) => {
    const mainUser = item.users[0];
    const avatarClass = "w-12 h-12 border-2";
    const storyClass = mainUser?.hasStory ? 'border-pink-500' : 'border-transparent';

    switch (item.type) {
        case 'suggestion':
        case 'follow':
        case 'post':
        case 'comment':
            return (
                <Avatar className={cn(avatarClass, storyClass)}>
                    {mainUser?.avatarUrl ? <AvatarImage src={mainUser.avatarUrl} /> : <AvatarFallback>{mainUser?.name.charAt(0)}</AvatarFallback>}
                </Avatar>
            );
        case 'login_alert':
            return (
                 <div className="w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center bg-red-50">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
            );
        case 'like':
            return (
                <div className="relative w-12 h-12">
                    <Avatar className="w-9 h-9 absolute top-0 left-0 z-10 border-2 border-background">
                         <AvatarImage src={item.users[0].avatarUrl} />
                         <AvatarFallback>{item.users[0].name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="w-7 h-7 absolute bottom-0 right-0 z-20 rounded-full bg-red-500 flex items-center justify-center border-2 border-background">
                        <Heart className="w-4 h-4 text-white fill-white"/>
                    </div>
                </div>
            )
        default:
            return <div className="w-12 h-12 rounded-full bg-muted" />;
    }
};

const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|@\w+)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('@')) {
             return <span key={i} className="text-blue-600">{part}</span>;
        }
        return part;
    });
};

export default function NotificationsPage() {
    const router = useRouter();

    const groupedNotifications = {
        "Son 7 gün": mockNotifications.slice(0, 2),
        "Son 30 gün": mockNotifications.slice(2),
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
                {Object.entries(groupedNotifications).map(([groupTitle, notifications]) => (
                    <div key={groupTitle}>
                        <h2 className="font-bold text-base p-4">{groupTitle}</h2>
                        {notifications.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-2">
                                <div className="shrink-0">{renderIcon(item)}</div>
                                <div className="flex-1 text-sm">
                                    <p>
                                        {formatText(item.text)}
                                        <span className="text-muted-foreground ml-1.5">{item.timestamp}</span>
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    {item.action === 'follow' && <Button size="sm">Takip Et</Button>}
                                    {item.action === 'following' && <Button size="sm" variant="secondary">Takip</Button>}
                                    {item.thumbnailUrl && (
                                        <Image 
                                            src={item.thumbnailUrl} 
                                            width={44} height={44} 
                                            alt="Notification thumbnail" 
                                            className="w-11 h-11 object-cover rounded-md" 
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </main>
        </div>
    );
}
