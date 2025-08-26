
'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Sun, Moon, Laptop, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

export default function AppearancePage() {
    const { theme, setTheme } = useTheme();
    const [animationsDisabled, setAnimationsDisabled] = useState(false);

    useEffect(() => {
        const storedPreference = localStorage.getItem('disableAnimations');
        if (storedPreference === 'true') {
            setAnimationsDisabled(true);
        }
    }, []);

    const handleAnimationToggle = (checked: boolean) => {
        setAnimationsDisabled(checked);
        localStorage.setItem('disableAnimations', String(checked));
        // Optional: Dispatch a custom event to notify other components immediately
        window.dispatchEvent(new CustomEvent('animation-preference-changed'));
         // Reload to apply changes immediately across the layout
        window.location.reload();
    };

    const themes = [
        { name: 'Gündüz', value: 'light', icon: <Sun className="w-6 h-6" /> },
        { name: 'Gece', value: 'dark', icon: <Moon className="w-6 h-6" /> },
        { name: 'Sistem', value: 'system', icon: <Laptop className="w-6 h-6" /> },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Görünüm</CardTitle>
                <CardDescription>
                    Uygulamanın arayüz temasını ve animasyonlarını kişiselleştirin.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="text-base font-medium">Tema</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        {themes.map((t) => (
                            <div
                                key={t.value}
                                className={cn(
                                    'p-4 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center gap-4 transition-colors',
                                    theme === t.value
                                        ? 'border-primary bg-primary/10'
                                        : 'border-muted hover:border-primary/50'
                                )}
                                onClick={() => setTheme(t.value)}
                            >
                                <div className="flex-1 flex items-center justify-center">
                                    {t.icon}
                                </div>
                                <div className="flex items-center gap-2 w-full justify-center">
                                    <span className="font-medium text-sm">{t.name}</span>
                                    {theme === t.value && <Check className="w-4 h-4 text-primary" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                 <div>
                    <Label className="text-base font-medium">Erişilebilirlik</Label>
                    <div className="flex items-center justify-between p-4 border rounded-lg mt-2">
                        <div className="space-y-1">
                            <Label htmlFor="disable-animations" className="font-semibold flex items-center gap-2">
                                <EyeOff className="h-5 w-5 text-primary" />
                                <span>Animasyonları Devre Dışı Bırak</span>
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Gezinme çubuklarının kaybolma animasyonunu kapatır.
                            </p>
                        </div>
                        <Switch 
                            id="disable-animations" 
                            checked={animationsDisabled} 
                            onCheckedChange={handleAnimationToggle}
                        />
                    </div>
                 </div>

            </CardContent>
        </Card>
    );
}
