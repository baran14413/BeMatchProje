
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Lock, User, MessageCircle, Heart, Camera } from "lucide-react";


const guideSections = [
    {
        value: 'item-1',
        title: 'Hesap Yönetimi',
        icon: <User className="w-5 h-5 mr-2 text-primary"/>,
        content: "Hesabınızı oluşturmak ve yönetmek çok kolaydır. Profili Düzenle sayfasından kişisel bilgilerinizi, fotoğraflarınızı ve parolanızı güncelleyebilirsiniz. Hesabınızı güvende tutmak için güçlü bir parola seçmeyi ve düzenli olarak değiştirmeyi unutmayın."
    },
    {
        value: 'item-2',
        title: 'Güvenlik',
        icon: <Shield className="w-5 h-5 mr-2 text-primary"/>,
        content: "Güvenliğiniz bizim için en önemli önceliktir. Şüpheli bir aktivite fark ederseniz veya bir kullanıcı sizi rahatsız ederse, lütfen profil sayfasındaki 'Şikayet Et' ve 'Engelle' seçeneklerini kullanın. Oturum Yönetimi sayfasından hesabınıza giriş yapılan tüm cihazları kontrol edebilirsiniz."
    },
    {
        value: 'item-3',
        title: 'Gizlilik İlkeleri',
        icon: <Lock className="w-5 h-5 mr-2 text-primary"/>,
        content: "Verilerinizin gizliliğine saygı duyuyoruz. Hesap Gizliliği ayarlarından profilinizin kimler tarafından görülebileceğini seçebilirsiniz. Çevrimiçi durumunuzu gizleyebilir ve kimlerin sizi etiketleyebileceğini kontrol edebilirsiniz. Verilerinizi asla üçüncü partilerle izniniz olmadan paylaşmayız."
    },
    {
        value: 'item-4',
        title: 'Eşleşme ve Sohbet',
        icon: <Heart className="w-5 h-5 mr-2 text-primary"/>,
        content: "Ana sayfada size uygun profilleri keşfedebilirsiniz. Birini beğendiğinizde, eğer o da sizi beğenirse bir eşleşme gerçekleşir ve sohbet etmeye başlayabilirsiniz. Sohbet ekranında mesajlarınızı güvenli bir şekilde gönderebilirsiniz."
    },
    {
        value: 'item-5',
        title: 'Gönderi Paylaşımı',
        icon: <Camera className="w-5 h-5 mr-2 text-primary"/>,
        content: "Anılarınızı fotoğraf veya metin gönderileriyle paylaşın. Keşfet sayfasında diğer kullanıcıların gönderilerini görebilir, beğenebilir ve yorum yapabilirsiniz. Yorumlardaki yabancı dildeki metinleri yapay zeka destekli çeviri özelliğimizle anında Türkçe'ye çevirebilirsiniz."
    }
]

export default function GuidePage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Uygulama Kılavuzu</CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {guideSections.map(section => (
                        <AccordionItem key={section.value} value={section.value}>
                            <AccordionTrigger className="text-lg">
                                <div className="flex items-center">
                                    {section.icon}
                                    {section.title}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground leading-relaxed pl-9">
                                {section.content}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}
