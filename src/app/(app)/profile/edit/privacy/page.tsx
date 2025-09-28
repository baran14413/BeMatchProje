'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { EyeOff, UserCheck, AtSign, Lock, Loader2, MessageSquareOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type PrivacySettings = {
    isPrivateAccount: boolean;
    isGalleryPrivate: boolean;
    showOnlineStatus: boolean;
    allowTagging: boolean;
    allowMessagesFromNonFollowers: boolean;
};

const PrivacySwitch = ({ id, icon, title, description, checked, onCheckedChange }: { id: keyof PrivacySettings, icon: React.ReactNode, title: string, description: string, checked: boolean, onCheckedChange: (id: keyof PrivacySettings, checked: boolean) => void }) => (
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
        <Switch id={id} checked={checked} onCheckedChange={(val) => onCheckedChange(id, val)} />
    </div>
);


export default function PrivacySettingsPage() {
    const { toast } = useToast();
    const currentUser = auth.currentUser;

    const [settings, setSettings] = useState<PrivacySettings>({
        isPrivateAccount: false,
        isGalleryPrivate: false,
        showOnlineStatus: true,
        allowTagging: true,
        allowMessagesFromNonFollowers: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setSettings({
                        isPrivateAccount: userData.isPrivateAccount || false,
                        isGalleryPrivate: userData.isGalleryPrivate || false,
                        showOnlineStatus: userData.showOnlineStatus !== false,
                        allowTagging: userData.allowTagging !== false,
                        allowMessagesFromNonFollowers: userData.allowMessagesFromNonFollowers !== false,
                    });
                }
            } catch (error) {
                console.error("Error fetching privacy settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [currentUser]);

    const handleCheckedChange = (id: keyof PrivacySettings, checked: boolean) => {
        setSettings(prev => ({...prev, [id]: checked}));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, settings);
            toast({
                title: 'Ayarlar Güncellendi',
                description: 'Gizlilik tercihleriniz kaydedildi.',
                className: 'bg-green-500 text-white',
            });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({ variant: 'destructive', title: "Ayarlar kaydedilemedi." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Gizlilik ve İzinler</CardTitle>
                    <CardDescription>Hesap gizliliği ve veri paylaşımı ayarlarınızı kontrol edin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                   <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2"><Skeleton className="h-5 w-32"/><Skeleton className="h-4 w-64"/></div>
                            <Skeleton className="h-6 w-11 rounded-full"/>
                        </div>
                         <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2"><Skeleton className="h-5 w-32"/><Skeleton className="h-4 w-64"/></div>
                            <Skeleton className="h-6 w-11 rounded-full"/>
                        </div>
                         <Separator />
                       <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2"><Skeleton className="h-5 w-32"/><Skeleton className="h-4 w-64"/></div>
                            <Skeleton className="h-6 w-11 rounded-full"/>
                        </div>
                         <Separator />
                       <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2"><Skeleton className="h-5 w-32"/><Skeleton className="h-4 w-64"/></div>
                            <Skeleton className="h-6 w-11 rounded-full"/>
                        </div>
                   </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gizlilik ve İzinler</CardTitle>
                <CardDescription>
                   Hesap gizliliği ve veri paylaşımı ayarlarınızı kontrol edin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                   <div className="space-y-6">
                        <PrivacySwitch 
                            id="isPrivateAccount"
                            icon={<EyeOff className="w-5 h-5 text-primary" />}
                            title="Gizli Hesap"
                            description="Aktif edildiğinde, sadece takipçileriniz gönderilerinizi görebilir."
                            checked={settings.isPrivateAccount}
                            onCheckedChange={handleCheckedChange}
                        />
                         <Separator />
                         <PrivacySwitch 
                            id="isGalleryPrivate"
                            icon={<Lock className="w-5 h-5 text-primary" />}
                            title="Gizli Galeri"
                            description="Aktif edildiğinde, galerinizdeki fotoğrafları sadece izin verdiğiniz kişiler görebilir."
                            checked={settings.isGalleryPrivate}
                            onCheckedChange={handleCheckedChange}
                        />
                         <Separator />
                         <PrivacySwitch 
                            id="allowMessagesFromNonFollowers"
                            icon={<MessageSquareOff className="w-5 h-5 text-primary" />}
                            title="Yabancılardan Mesaj Al"
                            description="Kapalı olduğunda, sadece takip ettiğiniz kişiler size mesaj gönderebilir."
                            checked={settings.allowMessagesFromNonFollowers}
                            onCheckedChange={handleCheckedChange}
                        />
                         <Separator />
                         <PrivacySwitch 
                            id="showOnlineStatus"
                            icon={<UserCheck className="w-5 h-5 text-primary" />}
                            title="Çevrimiçi Durumunu Göster"
                            description="Aktif olduğunuzda diğer kullanıcıların görmesine izin verin."
                            checked={settings.showOnlineStatus}
                            onCheckedChange={handleCheckedChange}
                        />
                         <Separator />
                         <PrivacySwitch 
                            id="allowTagging"
                            icon={<AtSign className="w-5 h-5 text-primary" />}
                            title="Etiketleme İzni"
                            description="Diğer kullanıcıların sizi gönderilerde etiketlemesine izin verin."
                            checked={settings.allowTagging}
                            onCheckedChange={handleCheckedChange}
                        />
                   </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Değişiklikleri Kaydet
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
