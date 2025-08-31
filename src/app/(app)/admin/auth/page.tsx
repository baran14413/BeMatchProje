
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, ShieldAlert, Lock, Camera, Loader2, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logSuspiciousActivity } from '@/ai/flows/log-suspicious-activity-flow';

const ADMIN_PIN = '2005';
const ADMIN_KEY = 'baranemir';

type AuthStep = 'pin' | 'key' | 'face-verify' | 'locked';

interface AdminAuthPageProps {
  onAuthenticated: () => void;
}

export default function AdminAuthPage({ onAuthenticated }: AdminAuthPageProps) {
    const [authStep, setAuthStep] = useState<AuthStep>('pin');
    const [inputValue, setInputValue] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [error, setError] = useState('');
    const { toast } = useToast();
    
    // Face verification states
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    

    const handleVerification = () => {
        if (authStep === 'pin') {
            if (inputValue === ADMIN_PIN) {
                setAuthStep('key');
                setInputValue('');
                setError('');
                setAttempts(0);
            } else {
                handleFailedAttempt('Hatalı PIN.');
            }
        } else if (authStep === 'key') {
            if (inputValue === ADMIN_KEY) {
                setError('');
                toast({ title: 'Giriş Başarılı!', description: 'Yönetim paneline yönlendiriliyorsunuz...', className: 'bg-green-500 text-white' });
                sessionStorage.setItem('admin-authenticated', 'true');
                onAuthenticated();
            } else {
                handleFailedAttempt('Hatalı Anahtar.');
            }
        }
    };
    
    const handleFailedAttempt = (errorMessage: string) => {
        const newAttempts = attempts + 1;
        setError(errorMessage);
        setInputValue('');
        
        if (newAttempts >= 2) {
            setAuthStep('face-verify');
            setAttempts(0); // Reset attempts for the next phase
        } else {
            setAttempts(newAttempts);
        }
    };
    
    useEffect(() => {
        if (authStep === 'face-verify') {
            const getCameraPermission = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    setHasCameraPermission(true);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error('Error accessing camera:', err);
                    setHasCameraPermission(false);
                }
            };
            getCameraPermission();
        }
    }, [authStep]);

    const handleCaptureAndVerify = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsVerifying(true);
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const photoDataUri = canvas.toDataURL('image/jpeg');

        try {
            await logSuspiciousActivity({
                attemptedPin: authStep === 'pin' ? inputValue : 'N/A',
                attemptedKey: authStep === 'key' ? inputValue : 'N/A',
                photoDataUri: photoDataUri,
            });
            
            toast({
                title: 'Güvenlik Kontrolü Başarılı',
                description: 'Ek deneme haklarınız tanımlandı.',
            });
            setAuthStep('pin'); // Go back to PIN entry
            setAttempts(-2); // Gives 4 attempts total (since it becomes -1 on next failure)
            
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Doğrulama Başarısız',
                description: 'Yüz fotoğrafı kaydedilemedi. Lütfen tekrar deneyin.',
            });
        } finally {
            setIsVerifying(false);
             video.srcObject?.getTracks().forEach(track => track.stop());
        }
    };

    const cardVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <canvas ref={canvasRef} className="hidden" />
            <AnimatePresence mode="wait">
                {authStep === 'pin' && (
                    <motion.div key="pin" variants={cardVariants} initial="initial" animate="animate" exit="exit">
                        <Card className="w-full max-w-sm">
                            <CardHeader className="text-center">
                                <ShieldAlert className="mx-auto h-12 w-12 text-primary" />
                                <CardTitle className="text-2xl mt-4">Admin Paneli Korumalı</CardTitle>
                                <CardDescription>Devam etmek için lütfen PIN kodunuzu girin.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    <Label htmlFor="pin">PIN</Label>
                                    <Input
                                        id="pin"
                                        type="password"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerification()}
                                        autoFocus
                                    />
                                    {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={handleVerification}>
                                    <Lock className="mr-2" />
                                    Doğrula
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {authStep === 'key' && (
                    <motion.div key="key" variants={cardVariants} initial="initial" animate="animate" exit="exit">
                        <Card className="w-full max-w-sm">
                            <CardHeader className="text-center">
                                <KeyRound className="mx-auto h-12 w-12 text-primary" />
                                <CardTitle className="text-2xl mt-4">Güvenlik Anahtarı</CardTitle>
                                <CardDescription>Lütfen güvenlik anahtarınızı girin.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    <Label htmlFor="key">Anahtar</Label>
                                    <Input
                                        id="key"
                                        type="password"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerification()}
                                        autoFocus
                                    />
                                    {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={handleVerification}>Onayla</Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
                
                {authStep === 'face-verify' && (
                    <motion.div key="face" variants={cardVariants} initial="initial" animate="animate" exit="exit">
                         <Card className="w-full max-w-sm">
                             <CardHeader className="text-center">
                                <Camera className="mx-auto h-12 w-12 text-destructive" />
                                <CardTitle className="text-2xl mt-4">Yüz Doğrulama Gerekiyor</CardTitle>
                             </CardHeader>
                            <CardContent>
                                {hasCameraPermission === null && <div className="flex justify-center p-4"><Loader2 className="w-8 h-8 animate-spin" /></div>}
                                {hasCameraPermission === false && (
                                     <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Kamera Erişimi Reddedildi</AlertTitle>
                                        <AlertDescription>
                                            Güvenlik doğrulaması için lütfen tarayıcı ayarlarından kamera izni verin.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {hasCameraPermission === true && (
                                    <div className='flex flex-col items-center gap-4'>
                                        <p className="text-sm text-muted-foreground text-center">Şüpheli giriş denemesi. Ek deneme hakkı için lütfen yüzünüzün net bir fotoğrafını çekin.</p>
                                        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary">
                                            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted />
                                        </div>
                                         <Button className="w-full" onClick={handleCaptureAndVerify} disabled={isVerifying}>
                                            {isVerifying && <Loader2 className="mr-2 animate-spin" />}
                                            Doğrula ve Devam Et
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

            </AnimatePresence>
        </main>
    );
}

