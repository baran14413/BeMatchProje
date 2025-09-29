
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Check, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';


const DEFAULT_CONFIG = {
    isEnabled: false,
    pin: null,
};

type AppLockConfig = {
    isEnabled: boolean;
    pin: string | null;
};


export default function AppLockPage() {
    const [config, setConfig] = useState<AppLockConfig>(DEFAULT_CONFIG);
    const [isMounted, setIsMounted] = useState(false);
    const { toast } = useToast();
    
    // PIN states
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('current');
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');

    useEffect(() => {
        const savedConfig = localStorage.getItem('app-lock-config');
        if (savedConfig) {
            // Merge with default to ensure all keys are present
            setConfig(prev => ({...prev, ...JSON.parse(savedConfig)}));
        }
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // When modal opens, determine the first step based on if a PIN is already set.
        if (isPinModalOpen) {
            setPinStep(config.pin ? 'current' : 'new');
        }
    }, [isPinModalOpen, config.pin]);


    const saveConfig = (newConfig: Partial<AppLockConfig>) => {
        const updatedConfig = { ...config, ...newConfig };
        setConfig(updatedConfig);
        localStorage.setItem('app-lock-config', JSON.stringify(updatedConfig));
    };

    const handleToggleLock = (isEnabled: boolean) => {
        if (isEnabled && !config.pin) {
            // If enabling for the first time, must set a PIN
            setPinStep('new');
            setIsPinModalOpen(true);
        } else {
            saveConfig({ isEnabled });
        }
    };

    const resetPinModal = () => {
        setIsPinModalOpen(false);
        setPinError('');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
    };

    const handlePinSubmit = () => {
        setPinError('');
        if (pinStep === 'current') {
            if (currentPin === config.pin) {
                setPinStep('new');
            } else {
                setPinError('Mevcut PIN hatalı.');
            }
        } else if (pinStep === 'new') {
            if (newPin.length !== 4) {
                setPinError('PIN 4 haneli olmalıdır.');
                return;
            }
            setPinStep('confirm');
        } else if (pinStep === 'confirm') {
            if (newPin === confirmPin) {
                saveConfig({ pin: newPin, isEnabled: true });
                toast({ title: 'PIN başarıyla ayarlandı!', className: 'bg-green-500 text-white' });
                resetPinModal();
            } else {
                setPinError('PIN\'ler eşleşmiyor.');
            }
        }
    };

    const PinInput = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => (
        <Input
            type="password"
            maxLength={4}
            value={value}
            onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) { // only allow digits
                    onChange(e.target.value);
                }
            }}
            className="text-center text-2xl tracking-[1.5rem] font-bold"
        />
    )

    if (!isMounted) {
        return <div className='flex items-center justify-center p-10'><Loader2 className='w-8 h-8 animate-spin'/></div>;
    }

    return (
        <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
            <Card>
                <CardHeader>
                    <CardTitle>Uygulama Şifresi</CardTitle>
                    <CardDescription>
                        Uygulamaya erişimi bir PIN kodu ile koruyun.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <Label htmlFor="app-lock-switch" className="font-semibold flex items-center gap-3">
                            <KeyRound className="h-5 w-5 text-primary" />
                            <span>Uygulama Kilidini Aktifleştir</span>
                        </Label>
                        <Switch
                            id="app-lock-switch"
                            checked={config.isEnabled}
                            onCheckedChange={handleToggleLock}
                        />
                    </div>
                    {config.isEnabled && (
                        <>
                            <Separator />
                            <div className="flex justify-between items-center">
                               <p className="text-sm text-muted-foreground">Uygulama şifrenizi değiştirmek için tıklayın.</p>
                                <DialogTrigger asChild>
                                    <Button variant="outline">PIN Değiştir</Button>
                                </DialogTrigger>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-center">
                        {pinStep === 'current' && 'Mevcut PIN\'inizi Girin'}
                        {pinStep === 'new' && 'Yeni PIN Oluşturun'}
                        {pinStep === 'confirm' && 'Yeni PIN\'inizi Onaylayın'}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Lütfen 4 haneli bir PIN kodu girin.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {pinStep === 'current' && <PinInput value={currentPin} onChange={setCurrentPin}/> }
                    {pinStep === 'new' && <PinInput value={newPin} onChange={setNewPin}/> }
                    {pinStep === 'confirm' && <PinInput value={confirmPin} onChange={setConfirmPin}/> }
                    
                    {pinError && <p className="text-sm text-center text-destructive">{pinError}</p>}
                </div>
                <DialogFooter className="sm:justify-between gap-2">
                    {pinStep === 'current' && <Button variant="link" className='p-0 h-auto' onClick={() => toast({title: "Bu özellik yakında eklenecektir."})}>PIN'imi Unuttum</Button> }
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" onClick={resetPinModal}>İptal</Button>
                        <Button onClick={handlePinSubmit}>Devam</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
