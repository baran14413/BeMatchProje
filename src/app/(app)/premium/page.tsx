
'use client';

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Crown, Star, ArrowLeft, Gem, Loader2, Copy } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { handlePaymentNotification } from '@/ai/flows/handle-payment-notification-flow';

const features = [
    { text: "Sınırsız Beğeni Hakkı", icon: <Star className="w-4 h-4 text-yellow-500"/> },
    { text: "Reklamları Kaldır", icon: <Check className="w-4 h-4 text-green-500"/> },
    { text: "Profilini Öne Çıkar", icon: <Check className="w-4 h-4 text-green-500"/> },
    { text: "Kimlerin Seni Beğendiğini Gör", icon: <Check className="w-4 h-4 text-green-500"/> },
    { text: "Gelişmiş Filtreleme Seçenekleri", icon: <Check className="w-4 h-4 text-green-500"/> },
    { text: "Mesaj Okundu Bilgisi", icon: <Check className="w-4 h-4 text-green-500"/> },
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
    },
    { 
        id: 'monthly',
        name: "1 Aylık",
        price: "250 TL",
        icon: <Gem className="w-8 h-8 text-purple-400"/>,
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        borderColor: "border-purple-400 dark:border-purple-600",
        buttonClass: "bg-purple-500 hover:bg-purple-600",
    },
    { 
        id: 'yearly',
        name: "1 Yıllık",
        price: "600 TL",
        icon: <Crown className="w-8 h-8 text-blue-400"/>,
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-300 dark:border-blue-700",
        buttonClass: "bg-blue-500 hover:bg-blue-600",
    }
];

const IBAN = "TR43 0013 4000 0237 7767 6000 01";
const ALICI = "Emirhan Deşdemir (Denizbank)";

export default function PremiumPage() {
    const [selectedPackage, setSelectedPackage] = useState('monthly');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);
    const router = useRouter();
    const currentUser = auth.currentUser;
    const { toast } = useToast();
    
    const activePackage = packages.find(p => p.id === selectedPackage);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Kopyalandı!", description: `${text} panoya kopyalandı.` });
    };

    const handleNotifyPayment = async () => {
        if (!currentUser || !activePackage) return;
        setIsNotifying(true);
        try {
            const result = await handlePaymentNotification({
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Bilinmiyor',
                userEmail: currentUser.email || 'Bilinmiyor',
                packageName: activePackage.name,
                packagePrice: activePackage.price,
            });
            if (result.success) {
                toast({
                    title: 'Bildiriminiz Alındı!',
                    description: 'Ödemeniz kontrol edildikten sonra premium üyeliğiniz en kısa sürede aktif edilecektir.',
                    className: 'bg-green-500 text-white',
                });
                setIsPaymentModalOpen(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Bildirim Gönderilemedi', description: error.message });
        } finally {
            setIsNotifying(false);
        }
    };

    return (
        <>
            <div className="container mx-auto max-w-5xl p-4 md:p-8">
                <div className="flex items-center gap-4 w-full mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold font-headline">Premium Paketler</h1>
                </div>

                <Card className="bg-gradient-to-br from-purple-600 to-blue-700 text-white overflow-hidden mb-8">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Crown className="w-12 h-12"/>
                            <div>
                                <CardTitle className="text-3xl md:text-4xl text-white font-headline">BeMatch Premium</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3">
                                {feature.icon}
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
                                "flex flex-col text-center transition-all duration-300 relative overflow-hidden cursor-pointer",
                                pkg.bgColor,
                                selectedPackage === pkg.id ? 'border-2 shadow-2xl scale-105' : 'hover:shadow-lg hover:-translate-y-1',
                                selectedPackage === pkg.id ? pkg.borderColor : 'border'
                            )}
                            onClick={() => setSelectedPackage(pkg.id)}
                        >
                            <CardHeader className="flex-grow-0">
                                <div className="mx-auto bg-white/20 p-4 rounded-full w-fit mb-4">
                                    {pkg.icon}
                                </div>
                                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                                <CardDescription className="text-4xl font-bold text-foreground mt-2">{pkg.price}</CardDescription>
                            </CardHeader>
                            <CardFooter className="mt-auto p-6">
                                <Button 
                                    className={cn("w-full font-bold text-lg py-6", pkg.buttonClass)} 
                                    onClick={() => setIsPaymentModalOpen(true)}
                                >
                                Satın Al
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    Ödemeler manuel olarak kontrol edilmektedir. Aboneliğiniz, ödemeniz onaylandıktan sonraki birkaç saat içinde aktif olacaktır.
                </p>
            </div>
            
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ödeme Bilgileri</DialogTitle>
                        <DialogDescription>
                            Lütfen aşağıdaki hesaba seçtiğiniz paket tutarını gönderin. <strong>Açıklama kısmına aşağıdaki kodu yazmayı unutmayın.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Alert>
                            <AlertTitle>Banka Bilgileri</AlertTitle>
                            <AlertDescription className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">{ALICI}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-mono text-sm">{IBAN}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(IBAN)}><Copy className="w-4 h-4"/></Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                         <Alert variant="destructive">
                            <AlertTitle>Açıklama Kodu (ZORUNLU)</AlertTitle>
                            <AlertDescription className="flex justify-between items-center">
                               <p>Ödemenizi size atayabilmemiz için bu kodu banka transferi açıklamasına yazmalısınız.</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm bg-muted p-1 rounded">{currentUser?.uid}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(currentUser?.uid || '')}><Copy className="w-4 h-4"/></Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>İptal</Button>
                        <Button onClick={handleNotifyPayment} disabled={isNotifying}>
                            {isNotifying && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Ödemeyi Yaptım, Bildir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
