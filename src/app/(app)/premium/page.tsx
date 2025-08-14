
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Gem, Crown, Star } from "lucide-react";
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
        icon: <Gem className="w-8 h-8 text-blue-400"/>,
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
                        <Gem className="w-12 h-12"/>
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

// Dummy components for icon placeholders to avoid breaking the build.
const XCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const TrendingUp = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const Eye = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const Filter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const CheckCheck = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 7 17l-5-5" />
    <path d="m22 10-7.5 7.5L13 16" />
  </svg>
);

const Heart = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
