
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, MessageSquare, Phone } from 'lucide-react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';

function ShuffleContent() {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);
    
    // Placeholder function for future implementation
    const handleSearchClick = () => {
        router.push('/shuffle-search'); // Redirect to a new searching page to be created
    };

    return (
        <div className='w-full max-w-sm flex flex-col items-center'>
            <h1 className="text-3xl font-bold font-headline">Rastgele Eşleşme</h1>
            <p className="max-w-md mt-2 mb-4 text-muted-foreground mx-auto">
                Sohbet türünü seçerek sana uygun biriyle tanış.
            </p>
            <div className="mb-4 flex justify-center gap-2">
                {Array.from({ length: count }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => api?.scrollTo(i)}
                        className={cn('h-2 w-2 rounded-full transition-all', current === i ? 'w-4 bg-primary' : 'bg-muted-foreground/30')}
                    />
                ))}
            </div>
            <Carousel setApi={setApi} className="w-full">
                <CarouselContent>
                    <CarouselItem>
                         <Card className="bg-background/80 backdrop-blur-sm border-2 border-primary/10 shadow-xl rounded-2xl w-full">
                            <CardHeader className='items-center'>
                                <MessageSquare className='w-12 h-12 text-primary mb-2'/>
                                <CardTitle className="text-2xl font-bold">Yazılı Eşleşme</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                                <Button 
                                    size="lg" 
                                    className="h-14 w-full text-lg rounded-full shadow-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground transition-transform hover:scale-105"
                                    onClick={() => alert("Eşleştirme mantığı daha sonra eklenecek.")}
                                >
                                    <Zap className="mr-3 h-5 w-5" />
                                    Eşleşme Bul
                                </Button>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                    <CarouselItem>
                         <Card className="bg-muted/50 border-2 border-dashed shadow-none rounded-2xl w-full">
                            <CardHeader className='items-center'>
                                <Phone className='w-12 h-12 text-muted-foreground mb-2'/>
                                <CardTitle className="text-2xl font-bold text-muted-foreground">Sesli Eşleşme</CardTitle>
                            </CardHeader>
                             <CardContent className="flex flex-col items-center gap-4">
                                <Button 
                                    size="lg" 
                                    className="h-14 w-full text-lg rounded-full"
                                    disabled
                                >
                                    Yakında...
                                </Button>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </div>
    );
}


export default function ShufflePage() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
            <Suspense fallback={<Loader2 className="w-12 h-12 text-primary animate-spin" />}>
                <ShuffleContent />
            </Suspense>
        </div>
    );
}
