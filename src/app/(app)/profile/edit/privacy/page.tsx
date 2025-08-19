
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { EyeOff, UserCheck, AtSign, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const PrivacySwitch = ({ id, icon, title, description, defaultChecked = true }: { id: string, icon: React.ReactNode, title: string, description: string, defaultChecked?: boolean }) => (
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


export default function PrivacySettingsPage() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: 'Ayarlar Güncellendi',
            description: 'Gizlilik tercihleriniz kaydedildi.',
            className: 'bg-green-500 text-white',
        });
    };

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
                            id="private-account"
                            icon={<EyeOff className="w-5 h-5 text-primary" />}
                            title="Gizli Hesap"
                            description="Aktif edildiğinde, sadece takipçileriniz gönderilerinizi görebilir."
                            defaultChecked={false}
                        />
                         <Separator />
                         <PrivacySwitch 
                            id="gallery-private"
                            icon={<Lock className="w-5 h-5 text-primary" />}
                            title="Gizli Galeri"
                            description="Aktif edildiğinde, galerinizdeki fotoğrafları sadece izin verdiğiniz kişiler görebilir."
                            defaultChecked={false}
                        />
                         <Separator />
                         <PrivacySwitch 
                            id="show-online-status"
                            icon={<UserCheck className="w-5 h-5 text-primary" />}
                            title="Çevrimiçi Durumunu Göster"
                            description="Aktif olduğunuzda diğer kullanıcıların görmesine izin verin."
                        />
                         <Separator />
                         <PrivacySwitch 
                            id="allow-tagging"
                            icon={<AtSign className="w-5 h-5 text-primary" />}
                            title="Etiketleme İzni"
                            description="Diğer kullanıcıların sizi gönderilerde etiketlemesine izin verin."
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
