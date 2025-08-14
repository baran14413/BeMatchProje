
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Bell, MessageCircle, Heart, UserPlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const NotificationSwitch = ({ id, icon, title, description, defaultChecked = true }: { id: string, icon: React.ReactNode, title: string, description: string, defaultChecked?: boolean }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
            <div className="mt-1">{icon}</div>
            <div className="space-y-1">
                <Label htmlFor={id} className="text-base font-medium">
                    {title}
                </Label>
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
        </div>
        <Switch id={id} defaultChecked={defaultChecked} />
    </div>
);


export default function NotificationSettingsPage() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: 'Ayarlar Güncellendi',
            description: 'Bildirim tercihleriniz kaydedildi.',
            className: 'bg-green-500 text-white',
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bildirim Ayarları</CardTitle>
                <CardDescription>
                   Hangi durumlarda bildirim almak istediğinizi seçin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                   <div className="space-y-6">
                        <NotificationSwitch 
                            id="new-message"
                            icon={<MessageCircle className="w-5 h-5 text-primary" />}
                            title="Yeni Mesajlar"
                            description="Birisi size yeni bir mesaj gönderdiğinde haberdar olun."
                        />
                         <Separator />
                         <NotificationSwitch 
                            id="new-like"
                            icon={<Heart className="w-5 h-5 text-primary" />}
                            title="Yeni Beğeniler"
                            description="Bir gönderiniz beğenildiğinde bildirim alın."
                        />
                         <Separator />
                         <NotificationSwitch 
                            id="new-follower"
                            icon={<UserPlus className="w-5 h-5 text-primary" />}
                            title="Yeni Takipçiler"
                            description="Biri sizi takip etmeye başladığında öğrenin."
                        />
                         <Separator />
                         <NotificationSwitch 
                            id="push-all"
                            icon={<Bell className="w-5 h-5 text-primary" />}
                            title="Tüm Anlık Bildirimler"
                            description="Uygulamadan gelen tüm anlık bildirimleri açıp kapatın."
                        />
                   </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Değişiklikleri Kaydet</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
