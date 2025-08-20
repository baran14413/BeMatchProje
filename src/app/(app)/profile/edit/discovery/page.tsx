
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Globe, Users, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';


export default function DiscoverySettingsPage() {
    const { toast } = useToast();
    const currentUser = auth.currentUser;

    const [ageRange, setAgeRange] = useState([24, 40]);
    const [distance, setDistance] = useState(50);
    const [isGlobal, setIsGlobal] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const discoverySettings = userDoc.data().discoverySettings;
                    if (discoverySettings) {
                        setAgeRange(discoverySettings.ageRange || [24, 40]);
                        setDistance(discoverySettings.distance || 50);
                        setIsGlobal(discoverySettings.isGlobal || false);
                    }
                }
            } catch (error) {
                 console.error("Error fetching discovery settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [currentUser]);

    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                discoverySettings: {
                    ageRange,
                    distance,
                    isGlobal,
                }
            });
            toast({
                title: 'Tercihler Güncellendi',
                description: 'Ana akış ayarlarınız başarıyla kaydedildi.',
                className: 'bg-green-500 text-white',
            });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({ variant: 'destructive', title: "Ayarlar kaydedilemedi." });
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Ana Akış Ayarları</CardTitle>
                    <CardDescription>Size uygun kişileri bulmak için arama kriterlerinizi belirleyin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="space-y-4">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-full rounded-full" />
                    </div>
                     <div className="space-y-4">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-full rounded-full" />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className='flex-1 space-y-2'>
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-6 w-11 rounded-full"/>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ana Akış Ayarları</CardTitle>
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
                            value={[distance]}
                            max={200}
                            step={5}
                            onValueChange={(value) => setDistance(value[0])}
                            disabled={saving}
                        />
                    </div>
                    <div className="space-y-4">
                         <Label htmlFor="ageRange" className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span>Yaş Aralığı: <span className="font-bold text-primary">{ageRange[0]} - {ageRange[1]}</span></span>
                        </Label>
                        <Slider
                            id="ageRange"
                            value={ageRange}
                            min={18}
                            max={65}
                            step={1}
                            minStepsBetweenThumbs={5}
                            onValueChange={setAgeRange}
                            disabled={saving}
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
                        <Switch id="global-mode" checked={isGlobal} onCheckedChange={setIsGlobal} disabled={saving} />
                    </div>
                     <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Değişiklikleri Kaydet
                        </Button>
                    </div>
                 </form>
            </CardContent>
        </Card>
    );
}
