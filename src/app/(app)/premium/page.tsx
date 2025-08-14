
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Crown, Star, XCircle, TrendingUp, Eye, Filter, CheckCheck, Heart } from "lucide-react";
import { useState } from "react";

const features = [
    { text: "Sınırsız Beğeni Hakkı", icon: <Heart className="w-4 h-4 text-pink-500"/> },
    { text: "Reklamları Kaldır", icon: <XCircle className="w-4 h-4 text-red-500"/> },
    { text: "Profilini Öne Çıkar", icon: <TrendingUp className="w-4 h-4 text-green-500"/> },
    { text: "Kimlerin Seni Beğendiğini Gör", icon: <Eye className="w-4 h-4 text-blue-500"/> },
    { text: "Gelişmiş Filtreleme Seçenekleri", icon: <Filter className="w-4 h-4 text-yellow-500"/> },
    { text: "Mesaj Okundu Bilgisi", icon: <CheckCheck className="w-4 h-4 text-purple-500"/> },
];

const packages = [
    { 
        id: 'weekly',
        name: "1 Haftalık",
        price: "150 TL",
        icon: <Star className="w-8 h-8 text-yellow-400"/>,
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-300 dark:border-yellow-700",
        buttonClass: "bg-yellow-500 hover:bg-yellow-600",
        isPopular: false
    },
    { 
        id: 'monthly',
        name: "1 Aylık",
        price: "250 TL",
        icon: <Crown className="w-8 h-8 text-purple-400"/>,
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        borderColor: "border-purple-400 dark:border-purple-600",
        buttonClass: "bg-purple-500 hover:bg-purple-600",
        isPopular: true
    },
    { 
        id: 'yearly',
        name: "1 Yıllık",
        price: "600 TL",
        icon: <Crown className="w-8 h-8 text-blue-400"/>,
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-300 dark:border-blue-700",
        buttonClass: "bg-blue-500 hover:bg-blue-600",
        isPopular: false
    }
];

export default function PremiumPage() {
    const [selectedPackage, setSelectedPackage] = useState('monthly');

    return (
        <div className="container mx-auto max-w-5xl p-4 md:p-8">
            <Card className="bg-gradient-to-br from-purple-600 to-blue-700 text-white overflow-hidden mb-8">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Crown className="w-12 h-12"/>
                        <div>
                            <CardTitle className="text-3xl md:text-4xl text-white font-headline">BeMatch Premium</CardTitle>
                            <CardDescription className="text-purple-200 text-lg mt-1">Deneyimini bir üst seviyeye taşı.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                   <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                       {features.map((feature, index) => (
                           <li key={index} className="flex items-center gap-3">
                               <Check className="w-5 h-5 text-green-400 shrink-0"/>
                               <span className="text-base">{feature.text}</span>
                           </li>
                       ))}
                   </ul>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                     <Card 
                        key={pkg.id} 
                        className={cn(
                            "flex flex-col text-center transition-all duration-300 relative overflow-hidden",
                            pkg.bgColor,
                            selectedPackage === pkg.id ? 'border-2 shadow-2xl scale-105' : 'hover:shadow-lg hover:-translate-y-1',
                            selectedPackage === pkg.id ? pkg.borderColor : 'border'
                        )}
                        onClick={() => setSelectedPackage(pkg.id)}
                     >
                        {pkg.isPopular && (
                            <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                POPÜLER
                            </div>
                        )}
                        <CardHeader className="flex-grow-0">
                            <div className="mx-auto bg-white/20 p-4 rounded-full w-fit mb-4">
                                {pkg.icon}
                            </div>
                            <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                            <CardDescription className="text-4xl font-bold text-foreground mt-2">{pkg.price}</CardDescription>
                        </CardHeader>
                        <CardFooter className="mt-auto p-6">
                            <Button className={cn("w-full font-bold text-lg py-6", pkg.buttonClass)}>
                               {selectedPackage === pkg.id ? 'Seçildi' : 'Seç'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8">
                Ödemeler güvenli bir şekilde işlenir. Aboneliğinizi istediğiniz zaman iptal edebilirsiniz.
            </p>
        </div>
    );
}
