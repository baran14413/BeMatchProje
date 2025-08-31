
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Smartphone, Brush, Database, Bot } from 'lucide-react';

const techSections = [
    {
        category: "Arayüz (Frontend)",
        icon: <Smartphone className="h-6 w-6 text-primary" />,
        technologies: [
            { name: "Next.js", description: "Hızlı, sunucu tarafı render (SSR) yetenekleri ve harika geliştirici deneyimi sunan modern bir React çatısıdır." },
            { name: "React", description: "Kullanıcı arayüzlerini bileşen bazlı bir yapıda oluşturmak için kullanılır. Bu, kodun yeniden kullanılabilirliğini ve bakımını kolaylaştırır." },
            { name: "TypeScript", description: "JavaScript'e statik tipler ekleyerek, büyük projelerde hataları azaltır ve kodun daha okunabilir olmasını sağlar. Gördüğünüz .ts ve .tsx dosyaları bu nedenledir." }
        ]
    },
    {
        category: "Stil ve Tasarım",
        icon: <Brush className="h-6 w-6 text-primary" />,
        technologies: [
            { name: "Tailwind CSS", description: "Hızlı ve tutarlı tasarımlar oluşturmak için kullanılan, son derece özelleştirilebilir bir CSS çerçevesidir." },
            { name: "Shadcn/UI", description: "Yeniden kullanılabilir ve erişilebilir arayüz bileşenleri (butonlar, kartlar vb.) için bir temel sağlar." }
        ]
    },
    {
        category: "Arka Uç ve Veritabanı (Backend)",
        icon: <Database className="h-6 w-6 text-primary" />,
        technologies: [
            { name: "Firebase", description: "Google tarafından sağlanan, kullanıcı kimlik doğrulama (Auth), veritabanı (Firestore), dosya depolama (Storage) ve sunucusuz fonksiyonlar (Cloud Functions) gibi hizmetleri barındıran güçlü bir platformdur." },
            { name: "Firestore", description: "Kullanıcı profilleri, gönderiler, sohbetler gibi verileri saklayan esnek ve ölçeklenebilir bir NoSQL veritabanıdır." }
        ]
    },
    {
        category: "Yapay Zeka (AI)",
        icon: <Bot className="h-6 w-6 text-primary" />,
        technologies: [
            { name: "Genkit (Gemini)", description: "Google'ın en gelişmiş yapay zeka modellerini kullanarak, fotoğraf denetleme, metin çevirisi ve gelecekteki AI özellikleri için kullanılır." }
        ]
    }
];

export default function TechnologiesPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Teknolojilerimiz</CardTitle>
                <CardDescription>
                    Bu uygulamanın arkasındaki teknolojiler ve mimari hakkında detaylı bilgi.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {techSections.map(section => (
                    <div key={section.category}>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            {section.icon}
                            {section.category}
                        </h3>
                        <div className="space-y-4 pl-8 border-l-2 border-primary/20 ml-3">
                           {section.technologies.map(tech => (
                               <div key={tech.name} className="relative">
                                    <div className="absolute -left-[30px] top-1 h-3 w-3 rounded-full bg-primary" />
                                    <p className="font-semibold">{tech.name}</p>
                                    <p className="text-muted-foreground text-sm">{tech.description}</p>
                               </div>
                           ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
