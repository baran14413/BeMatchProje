
'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Sun, Moon, Laptop, EyeOff, Columns3, Rows3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

const ThemePreviewCard = ({ themeName, isSelected, children }: { themeName: string, isSelected: boolean, children: React.ReactNode}) => (
    <div className={cn('p-1 rounded-lg border-2 flex flex-col items-center justify-center gap-4 transition-colors', isSelected ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50')}>
        <div className="aspect-video w-full rounded-md p-2 overflow-hidden bg-background">
            {children}
        </div>
        <div className="flex items-center gap-2 w-full justify-center pb-2">
            <span className="font-medium text-sm">{themeName}</span>
            {isSelected && <Check className="w-4 h-4 text-primary" />}
        </div>
    </div>
);

const AnimationPreview = ({ isDisabled }: { isDisabled: boolean }) => {
    const [view, setView] = useState<'list' | 'grid'>('list');

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setView('list')}
                    className={cn('p-2 rounded-md transition-colors', view === 'list' ? 'bg-primary/20 text-primary' : 'bg-muted')}
                >
                    <Rows3 className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setView('grid')}
                    className={cn('p-2 rounded-md transition-colors', view === 'grid' ? 'bg-primary/20 text-primary' : 'bg-muted')}
                >
                    <Columns3 className="w-5 h-5" />
                </button>
            </div>
            <div className="w-48 h-24 mt-2 bg-muted rounded-lg overflow-hidden relative flex items-center justify-center">
                <AnimatePresence initial={false}>
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: isDisabled ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: isDisabled ? 0 : -10 }}
                        transition={{ duration: isDisabled ? 0 : 0.3 }}
                        className="absolute"
                    >
                        {view === 'list' ? (
                            <div className="space-y-1">
                                <div className="h-2 w-32 bg-muted-foreground/30 rounded-full"></div>
                                <div className="h-2 w-24 bg-muted-foreground/30 rounded-full"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-1">
                                <div className="h-8 w-16 bg-muted-foreground/30 rounded"></div>
                                <div className="h-8 w-16 bg-muted-foreground/30 rounded"></div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
                <p className="text-xs text-muted-foreground absolute bottom-2">
                    {isDisabled ? 'Animasyon Kapalı' : 'Animasyon Açık'}
                </p>
            </div>
        </div>
    );
};


export default function AppearancePage() {
    const { theme, setTheme } = useTheme();
    const [animationsDisabled, setAnimationsDisabled] = useState(false);
    
    useEffect(() => {
        const storedAnimationPref = localStorage.getItem('disableAnimations');
        if (storedAnimationPref === 'true') {
            setAnimationsDisabled(true);
        }
    }, []);

    const handleAnimationToggle = (checked: boolean) => {
        setAnimationsDisabled(checked);
        localStorage.setItem('disableAnimations', String(checked));
        window.dispatchEvent(new CustomEvent('animation-preference-changed'));
        window.location.reload();
    };
    
    const themes = [
        { name: 'Gündüz', value: 'light', icon: <Sun className="w-6 h-6" />, 
          preview: (
              <div className="w-full h-full rounded bg-white flex flex-col gap-1 p-1">
                  <div className="h-2 w-1/3 rounded-sm bg-gray-300"></div>
                  <div className="h-2 w-2/3 rounded-sm bg-gray-200"></div>
                  <div className="flex-1 rounded-sm bg-gray-100 mt-1"></div>
              </div>
          )
        },
        { name: 'Gece', value: 'dark', icon: <Moon className="w-6 h-6" />,
          preview: (
              <div className="w-full h-full rounded bg-gray-900 flex flex-col gap-1 p-1">
                  <div className="h-2 w-1/3 rounded-sm bg-gray-600"></div>
                  <div className="h-2 w-2/3 rounded-sm bg-gray-700"></div>
                  <div className="flex-1 rounded-sm bg-gray-800 mt-1"></div>
              </div>
          )
        },
        { name: 'Sistem', value: 'system', icon: <Laptop className="w-6 h-6" />,
           preview: (
             <div className="w-full h-full rounded flex">
                <div className="w-1/2 h-full bg-white flex flex-col gap-1 p-1 rounded-l">
                    <div className="h-2 w-1/3 rounded-sm bg-gray-300"></div>
                    <div className="h-2 w-2/3 rounded-sm bg-gray-200"></div>
                </div>
                <div className="w-1/2 h-full bg-gray-900 flex flex-col gap-1 p-1 rounded-r">
                    <div className="h-2 w-1/3 rounded-sm bg-gray-600"></div>
                    <div className="h-2 w-2/3 rounded-sm bg-gray-700"></div>
                </div>
             </div>
          )
        },
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
                             <div key={t.value} onClick={() => setTheme(t.value)} className="cursor-pointer">
                                <ThemePreviewCard themeName={t.name} isSelected={theme === t.value}>
                                    {t.preview}
                                </ThemePreviewCard>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                 <div>
                    <Label className="text-base font-medium">Erişilebilirlik</Label>
                    <div className="flex items-center justify-between p-4 border rounded-lg mt-2">
                       <div className="flex-1">
                            <div className="space-y-1">
                                <Label htmlFor="disable-animations" className="font-semibold flex items-center gap-2">
                                    <EyeOff className="h-5 w-5 text-primary" />
                                    <span>Animasyonları Devre Dışı Bırak</span>
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Arayüzdeki geçiş ve kayma animasyonlarını kapatır.
                                </p>
                            </div>
                             <Switch id="disable-animations" checked={animationsDisabled} onCheckedChange={handleAnimationToggle} className="mt-4 sm:hidden" />
                       </div>
                       <div className="hidden sm:flex flex-col items-center">
                           <AnimationPreview isDisabled={animationsDisabled} />
                       </div>
                        <Switch id="disable-animations-desktop" checked={animationsDisabled} onCheckedChange={handleAnimationToggle} className="hidden sm:flex ml-4" />
                    </div>
                 </div>
            </CardContent>
        </Card>
    );
}
