
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shuffle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

const DiscoveryCard = ({ icon, title, description, href, custom, bgColor, textColor, buttonClass, buttonText, isExternal = false }: { icon: React.ReactNode, title: string, description: string, href: string, custom: number, bgColor: string, textColor: string, buttonClass: string, buttonText: string, isExternal?: boolean }) => (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={custom}>
         <Link href={href} passHref={isExternal} target={isExternal ? '_blank' : '_self'}>
            <Card className={`overflow-hidden h-full flex flex-col group transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 ${bgColor} ${textColor}`}>
                <CardHeader>
                    {icon}
                    <CardTitle className="text-2xl font-bold mt-4">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <CardDescription className={`${textColor} opacity-80`}>
                        {description}
                    </CardDescription>
                </CardContent>
                <CardFooter>
                     <Button className={`w-full font-bold text-lg py-6 transition-transform duration-300 group-hover:scale-105 ${buttonClass}`}>
                        {buttonText}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </CardFooter>
            </Card>
         </Link>
    </motion.div>
);

export default function DiscoveryPage() {
    const features = [
        {
            icon: <Shuffle className="w-12 h-12 text-purple-300" />,
            title: "Rastgele Eşleşme",
            description: "Şansını dene! Tek bir tıkla o an müsait olan biriyle 5 dakikalık sürpriz bir sohbete başla. Bakalım karşına kim çıkacak?",
            href: "/shuffle",
            bgColor: "bg-gradient-to-br from-purple-500 to-indigo-600",
            textColor: "text-white",
            buttonClass: "bg-white text-purple-600 hover:bg-purple-100",
            buttonText: "Hemen Dene"
        },
        {
            icon: <Users className="w-12 h-12 text-pink-300" />,
            title: "Yakınındaki Kişiler",
            description: "Çevrendeki insanları keşfet. Ana akışta sana en uygun profilleri listeliyoruz. Beğen, eşleş ve sohbete başla!",
            href: "/match",
            bgColor: "bg-gradient-to-br from-pink-500 to-rose-600",
            textColor: "text-white",
            buttonClass: "bg-white text-pink-600 hover:bg-pink-100",
            buttonText: "Keşfet"
        },
    ];

    return (
        <div className="container mx-auto max-w-4xl p-4 md:p-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                    Keşif Merkezi
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    BeMatch'in sunduğu farklı tanışma deneyimlerini buradan keşfet.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                    <DiscoveryCard key={index} custom={index} {...feature} />
                ))}
            </div>
        </div>
    );
}
