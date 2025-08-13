'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Camera, UserCheck, UserX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const HOBBIES = [
  'Müzik', 'Spor', 'Seyahat', 'Kitap Okumak', 'Film/Dizi', 
  'Yemek Yapmak', 'Oyun', 'Doğa Yürüyüşü', 'Sanat', 'Teknoloji'
];

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    hobbies: [] as string[],
  });
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'fail' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (step === 3) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Kamera Erişimi Reddedildi',
            description: 'Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin.',
          });
        }
      };
      getCameraPermission();
    } else {
        // Cleanup camera stream when leaving step 3
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [step, toast]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
  };

  const toggleHobby = (hobby: string) => {
    setFormData((prev) => {
      const newHobbies = prev.hobbies.includes(hobby)
        ? prev.hobbies.filter((h) => h !== hobby)
        : [...prev.hobbies, hobby];
      return { ...prev, hobbies: newHobbies };
    });
  };
  
  const handleVerification = () => {
    setIsVerifying(true);
    setVerificationResult(null);

    // Mock verification logic
    setTimeout(() => {
        // This is a mock verification. In a real app, you'd use a face detection/verification API.
        // We'll randomly succeed or fail for demonstration.
        const isSuccess = Math.random() > 0.3; // 70% chance of success
        
        if(isSuccess){
            setVerificationResult('success');
            setTimeout(() => {
                 toast({
                    title: "Doğrulama Başarılı!",
                    description: "Hesabınız başarıyla oluşturuldu.",
                });
                router.push('/match');
            }, 1500)
        } else {
            setVerificationResult('fail');
        }

        setIsVerifying(false);
    }, 2500);
  }

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const progress = (step / 3) * 100;
  
  const getVerificationUI = () => {
    if (isVerifying) {
        return (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 transition-all duration-300">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                <p className="mt-4 text-primary-foreground font-semibold">Doğrulanıyor...</p>
            </div>
        );
    }
    if (verificationResult === 'success') {
         return (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/80 backdrop-blur-sm z-10 transition-all duration-300">
                <UserCheck className="w-16 h-16 text-white"/>
                <p className="mt-4 text-white font-semibold">Doğrulama Başarılı</p>
            </div>
        );
    }
     if (verificationResult === 'fail') {
         return (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/80 backdrop-blur-sm z-10 transition-all duration-300">
                <UserX className="w-16 h-16 text-destructive-foreground"/>
                <p className="mt-4 text-destructive-foreground font-semibold">Doğrulama Başarısız</p>
                <p className="text-xs text-destructive-foreground/80">Lütfen yüzünüzün net göründüğünden emin olun.</p>
                 <Button variant="secondary" size="sm" className="mt-4" onClick={() => setVerificationResult(null)}>Tekrar Dene</Button>
            </div>
        );
    }
    return null;
  }

  return (
    <Card className="w-full max-w-md">
       <CardHeader>
        <CardTitle className="text-2xl font-headline">Hesap Oluştur</CardTitle>
        <CardDescription>
          {step === 1 && "Kişisel bilgilerinizi girin."}
          {step === 2 && "Sizi daha iyi tanımamıza yardımcı olun."}
          {step === 3 && "Kimliğinizi doğrulamak için yüzünüzü taratın."}
        </CardDescription>
        <Progress value={progress} className="w-full mt-2" />
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Ad</Label>
              <Input id="firstName" placeholder="Can" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Soyad</Label>
              <Input id="lastName" placeholder="Yılmaz" value={formData.lastName} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" placeholder="ornek@mail.com" value={formData.email} onChange={handleChange} required />
            </div>
          </div>
        )}
        {step === 2 && (
            <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="age">Yaş</Label>
                        <Input id="age" type="number" placeholder="25" value={formData.age} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="gender">Cinsiyet</Label>
                        <Select onValueChange={handleGenderChange} value={formData.gender}>
                        <SelectTrigger id="gender">
                            <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="female">Kadın</SelectItem>
                            <SelectItem value="male">Erkek</SelectItem>
                            <SelectItem value="other">Diğer</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid gap-2">
                    <Label>İlgi Alanları (En az 3 tane seçin)</Label>
                    <div className="flex flex-wrap gap-2">
                        {HOBBIES.map((hobby) => (
                        <Badge
                            key={hobby}
                            variant={formData.hobbies.includes(hobby) ? 'default' : 'secondary'}
                            onClick={() => toggleHobby(hobby)}
                            className="cursor-pointer"
                        >
                            {hobby}
                        </Badge>
                        ))}
                    </div>
                </div>
            </div>
        )}
         {step === 3 && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto">
                 <div className="absolute inset-0 rounded-full bg-muted overflow-hidden flex items-center justify-center border-4 border-dashed border-primary/50 animate-pulse">
                     <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                     {hasCameraPermission === false && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
                            <Camera className="w-16 h-16 mb-4"/>
                            <p className="text-center font-medium">Kamera Erişimi Gerekli</p>
                        </div>
                    )}
                 </div>
                 <div className="absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(255,255,255,0.8)] dark:shadow-[0_0_0_9999px_rgba(10,10,10,0.8)] pointer-events-none"/>
                 {getVerificationUI()}
            </div>

            {hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Kamera İznini Etkinleştirin</AlertTitle>
                    <AlertDescription>
                       Yüz doğrulama için lütfen tarayıcı ayarlarından kamera erişimine izin verin.
                    </AlertDescription>
                </Alert>
            )}
             <p className="text-sm text-muted-foreground text-center mt-2">
                Lütfen yüzünüzü dairenin içine ortalayın ve net bir şekilde göründüğünden emin olun.
            </p>
          </div>
        )}
      </CardContent>
       <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full justify-between">
            {step > 1 && <Button variant="outline" onClick={prevStep}>Geri</Button>}
            <div className="flex-grow" />
            {step < 3 && <Button onClick={nextStep}>İleri</Button>}
            {step === 3 && <Button onClick={handleVerification} disabled={!hasCameraPermission || isVerifying || verificationResult === 'success'}>Doğrula ve Bitir</Button>}
        </div>
        <div className="mt-2 text-center text-sm">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="underline">
              Giriş Yap
            </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
