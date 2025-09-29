
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Bell, MessageCircle, Heart, UserPlus, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useNotification } from '@/hooks/use-notifications';
import { useState, useEffect } from 'react';

const NotificationSwitch = ({ id, icon, title, description, checked, onCheckedChange, disabled }: { id: string, icon: React.ReactNode, title: string, description: string, checked: boolean, onCheckedChange: (checked: boolean) => void, disabled?: boolean }) => (
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
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled}/>
    </div>
);


export default function NotificationSettingsPage() {
    const { toast } = useToast();
    const { requestPermission, isSubscribed, setSubscribed, isLoading } = useNotification();
    const [pushEnabled, setPushEnabled] = useState(isSubscribed);

    useEffect(() => {
        setPushEnabled(isSubscribed);
    }, [isSubscribed]);

    const handlePushToggle = async (checked: boolean) => {
        if (isLoading) return;

        if (checked) {
            const success = await requestPermission();
            setPushEnabled(success);
            setSubscribed(success);
        } else {
            // Note: Disabling notifications via a switch like this is a UX pattern.
            // It doesn't actually remove the browser permission or delete the FCM token.
            // To truly "unsubscribe", the user would need to revoke permission in browser settings.
            // For our app's logic, we can treat this as a preference.
            setPushEnabled(false);
            setSubscribed(false);
            toast({ title: "Anlık bildirimler kapatıldı." });
        }
    };


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
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="mt-1"><Bell className="w-5 h-5 text-primary" /></div>
                                <div className="space-y-1">
                                    <Label htmlFor="push-all" className="text-base font-medium">
                                        Tüm Anlık Bildirimler
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Uygulamadan gelen tüm anlık bildirimleri açıp kapatın.
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-center gap-2'>
                                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                                <Switch id="push-all" checked={pushEnabled} onCheckedChange={handlePushToggle} disabled={isLoading} />
                            </div>
                        </div>
                        <Separator />
                        <NotificationSwitch 
                            id="new-message"
                            icon={<MessageCircle className="w-5 h-5 text-primary" />}
                            title="Yeni Mesajlar"
                            description="Birisi size yeni bir mesaj gönderdiğinde haberdar olun."
                            checked={pushEnabled}
                            onCheckedChange={() => {}}
                            disabled={!pushEnabled}
                        />
                         <Separator />
                         <NotificationSwitch 
                            id="new-like"
                            icon={<Heart className="w-5 h-5 text-primary" />}
                            title="Yeni Beğeniler"
                            description="Bir gönderiniz beğenildiğinde bildirim alın."
                            checked={pushEnabled}
                            onCheckedChange={() => {}}
                             disabled={!pushEnabled}
                        />
                         <Separator />
                         <NotificationSwitch 
                            id="new-follower"
                            icon={<UserPlus className="w-5 h-5 text-primary" />}
                            title="Yeni Takipçiler"
                            description="Biri sizi takip etmeye başladığında öğrenin."
                            checked={pushEnabled}
                            onCheckedChange={() => {}}
                             disabled={!pushEnabled}
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
