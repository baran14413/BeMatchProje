import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Camera, Heart, KeyRound, Bell, Shield, SlidersHorizontal, Gem, ChevronRight, LogOut } from 'lucide-react';
import Link from "next/link";

const SettingsItem = ({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href: string }) => (
    <Link href={href} className="w-full">
        <div className="flex items-center p-4 hover:bg-accent transition-colors rounded-lg cursor-pointer">
            <div className="p-2 bg-muted rounded-full mr-4">
                {icon}
            </div>
            <div className="flex-1">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
    </Link>
);


export default function EditProfilePage() {
    return (
        <div className="container mx-auto max-w-3xl p-4 md:p-8">
            <div className="flex flex-col gap-8">

                <div className="flex flex-col items-start">
                    <h1 className="text-3xl font-bold font-headline">Ayarlar</h1>
                    <p className="text-muted-foreground mt-1">Profilinizi, tercihlerinizi ve hesap ayarlarınızı yönetin.</p>
                </div>

                {/* BeWalk Premium Card */}
                <Card className="bg-gradient-to-br from-purple-500 to-blue-600 text-white overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Gem className="w-8 h-8"/>
                            <CardTitle className="text-2xl text-white">BeWalk Premium</CardTitle>
                        </div>
                         <CardDescription className="text-purple-200 pt-2">
                           Sınırsız beğeni, gelişmiş filtreler ve daha fazlasıyla deneyimini bir üst seviyeye taşı.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="bg-white text-purple-600 hover:bg-gray-100 w-full font-bold">
                            Premium'u Keşfet
                        </Button>
                    </CardContent>
                </Card>

                {/* Hesap Ayarları */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hesap Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="flex flex-col">
                            <SettingsItem
                                icon={<User className="w-5 h-5 text-foreground" />}
                                title="Kişisel Bilgiler"
                                description="Ad, yaş, bio gibi temel bilgilerinizi güncelleyin."
                                href="#"
                            />
                             <Separator />
                             <SettingsItem
                                icon={<Camera className="w-5 h-5 text-foreground" />}
                                title="Fotoğrafları Yönet"
                                description="Profil ve galeri fotoğraflarınızı ekleyin veya kaldırın."
                                href="#"
                            />
                             <Separator />
                            <SettingsItem
                                icon={<KeyRound className="w-5 h-5 text-foreground" />}
                                title="Şifre ve Güvenlik"
                                description="Şifrenizi değiştirin ve hesap güvenliğinizi artırın."
                                href="#"
                            />
                       </div>
                    </CardContent>
                </Card>
                
                {/* Tercihler */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tercihler</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="flex flex-col">
                            <SettingsItem
                                icon={<SlidersHorizontal className="w-5 h-5 text-foreground" />}
                                title="Keşfet Ayarları"
                                description="Yaş aralığı ve mesafe gibi eşleşme kriterlerinizi değiştirin."
                                href="#"
                            />
                             <Separator />
                            <SettingsItem
                                icon={<Bell className="w-5 h-5 text-foreground" />}
                                title="Bildirim Ayarları"
                                description="Anlık bildirim tercihlerinizi yönetin."
                                href="#"
                            />
                             <Separator />
                            <SettingsItem
                                icon={<Shield className="w-5 h-5 text-foreground" />}
                                title="Gizlilik ve İzinler"
                                description="Hesap gizliliği ve veri paylaşımı ayarlarınızı kontrol edin."
                                href="#"
                            />
                       </div>
                    </CardContent>
                </Card>

                 {/* Logout Button */}
                <Card>
                     <CardContent className="p-0">
                        <div className="flex flex-col">
                            <SettingsItem
                                icon={<LogOut className="w-5 h-5 text-destructive" />}
                                title="Çıkış Yap"
                                description="Hesabınızdan güvenli bir şekilde çıkış yapın."
                                href="/login"
                            />
                        </div>
                    </CardContent>
                </Card>


            </div>
        </div>
    );
}
