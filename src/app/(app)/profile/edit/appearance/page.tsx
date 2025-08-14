
'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppearancePage() {
    const { theme, setTheme } = useTheme();

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
                    Uygulamanın arayüz temasını kişiselleştirin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </CardContent>
        </Card>
    );
}
