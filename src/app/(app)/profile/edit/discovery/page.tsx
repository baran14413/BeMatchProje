
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Globe, Users, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DiscoverySettingsPage() {
    const [ageRange, setAgeRange] = useState([24, 40]);
    const [distance, setDistance] = useState(50);
    const { toast } = useToast();
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
        title: 'Tercihler Güncellendi',
        description: 'Keşfet ayarlarınız başarıyla kaydedildi.',
        className: 'bg-green-500 text-white',
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Keşfet Ayarları</CardTitle>
                <CardDescription>
                Size uygun kişileri bulmak için arama kriterlerinizi belirleyin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <Label htmlFor="distance" className="flex items-center gap-2">
                           <MapPin className="h-5 w-5 text-primary" />
                           <span>Mesafe Limiti: <span className="font-bold text-primary">{distance} km</span></span>
                        </Label>
                        <Slider
                            id="distance"
                            defaultValue={[distance]}
                            max={200}
                            step={5}
                            onValueChange={(value) => setDistance(value[0])}
                        />
                    </div>
                    <div className="space-y-4">
                         <Label htmlFor="ageRange" className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span>Yaş Aralığı: <span className="font-bold text-primary">{ageRange[0]} - {ageRange[1]}</span></span>
                        </Label>
                        <Slider
                            id="ageRange"
                            defaultValue={ageRange}
                            min={18}
                            max={65}
                            step={1}
                            minStepsBetweenThumbs={5}
                            onValueChange={setAgeRange}
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className='space-y-1'>
                            <Label htmlFor="global-mode" className="font-semibold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                <span>Global Mod</span>
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Dünyanın her yerinden insanlarla tanışın.
                            </p>
                        </div>
                        <Switch id="global-mode" />
                    </div>
                     <div className="flex justify-end">
                        <Button type="submit">Değişiklikleri Kaydet</Button>
                    </div>
                 </form>
            </CardContent>
        </Card>
    );
}
