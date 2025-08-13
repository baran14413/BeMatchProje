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
import { Camera, UserCheck, UserX, AlertTriangle, Loader } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const HOBBIES = [
  'Müzik', 'Spor', 'Seyahat', 'Kitap Okumak', 'Film/Dizi', 
  'Yemek Yapmak', 'Oyun', 'Doğa Yürüyüşü', 'Sanat', 'Teknoloji'
];

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'fail';
type FailureReason = 'no_face' | 'gender_mismatch' | 'not_live';

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
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [failureReason, setFailureReason] = useState<FailureReason | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleVerification = () => {
    // Allow retry on fail
    if (verificationStatus === 'verifying' || verificationStatus === 'success') return;

    setVerificationStatus('verifying');
    setFailureReason(null);

    // Clear any existing timeout
    if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
    }

    verificationTimeoutRef.current = setTimeout(() => {
        // This is a mock verification. In a real app, you'd use a face detection/verification API.
        const mockFaceFound = Math.random() > 0.1; // 90% chance to "find" a face
        const mockIsLive = Math.random() > 0.2; // 80% chance of being "live"
        
        // Mock detected gender to be the same as the selected one to simulate success.
        const mockDetectedGender = formData.gender;

        if (!mockFaceFound) {
            setFailureReason('no_face');
            setVerificationStatus('fail');
            return;
        }

        if (!mockIsLive) {
            setFailureReason('not_live');
            setVerificationStatus('fail');
            return;
        }
        
        // This check will now only fail if something unexpected happens with the mock.
        if (formData.gender && formData.gender !== 'other' && formData.gender !== mockDetectedGender) {
            setFailureReason('gender_mismatch');
            setVerificationStatus('fail');
            toast({
                variant: 'destructive',
                title: 'Cinsiyet Uyuşmazlığı',
                description: 'Belirttiğiniz cinsiyetle doğrulama eşleşmedi. 5 saniye içinde önceki adıma yönlendiriliyorsunuz.',
            });
            setTimeout(() => {
                setVerificationStatus('idle');
                setFailureReason(null);
                prevStep();
            }, 5000);
            return;
        }

        setVerificationStatus('success');
        setTimeout(() => {
            toast({
                title: "Doğrulama Başarılı!",
                description: "Hesabınız başarıyla oluşturuldu. Yönlendiriliyorsunuz...",
                className: "bg-green-500 text-white",
            });
            router.push('/match');
        }, 1500);

    }, 3000);
  };
  
  useEffect(() => {
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
    
    if (step === 3) {
      getCameraPermission();
    } else {
      // Cleanup camera stream and verification timeout when leaving step 3
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
      setVerificationStatus('idle'); // Reset status when leaving page
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [step, toast]);
  
  // Automatically start verification when camera is ready
  useEffect(() => {
    if (step === 3 && hasCameraPermission && verificationStatus === 'idle') {
        handleVerification();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, hasCameraPermission, verificationStatus]);


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

  const progress = (step / 3) * 100;

  const getFailureMessage = () => {
    switch(failureReason) {
        case 'no_face':
            return 'Yüz algılanamadı. Lütfen yüzünüzü dairenin içine ortalayın.';
        case 'not_live':
            return 'Canlılık algılanamadı. Lütfen bir fotoğraf yerine kendinizi gösterin.';
        case 'gender_mismatch':
            return 'Cinsiyetinizle belirttiğiniz bilgi uyuşmuyor. Lütfen kontrol edin.';
        default:
            return 'Doğrulama başarısız oldu. Lütfen tekrar deneyin.';
    }
  }

  const getBorderColorClass = () => {
    switch (verificationStatus) {
        case 'verifying':
            return 'border-primary/50 animate-pulse';
        case 'success':
            return 'border-green-500';
        case 'fail':
            return 'border-destructive';
        default:
            return 'border-primary/50';
    }
  };

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
                 <div className={`relative w-full h-full rounded-full bg-muted overflow-hidden flex items-center justify-center border-8 border-dashed transition-colors duration-500 ${getBorderColorClass()}`}>
                     <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                     {hasCameraPermission === false && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
                            <Camera className="w-16 h-16 mb-4"/>
                            <p className="text-center font-medium">Kamera Erişimi Gerekli</p>
                        </div>
                    )}
                    {verificationStatus === 'verifying' && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                            <Loader className="w-16 h-16 text-primary animate-spin"/>
                            <p className="mt-4 text-primary-foreground font-semibold">Doğrulanıyor...</p>
                        </div>
                    )}
                    {verificationStatus === 'success' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/80 z-10">
                            <UserCheck className="w-16 h-16 text-white"/>
                            <p className="mt-4 text-white font-semibold">Doğrulama Başarılı</p>
                        </div>
                    )}
                 </div>
            </div>

            {verificationStatus === 'fail' && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Doğrulama Başarısız</AlertTitle>
                    <AlertDescription>
                       {getFailureMessage()}
                       {failureReason !== 'gender_mismatch' && (
                         <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setVerificationStatus('idle')}>Tekrar Dene</Button>
                       )}
                    </AlertDescription>
                </Alert>
            )}

            {hasCameraPermission && verificationStatus !== 'fail' && (
                 <p className="text-sm text-muted-foreground text-center mt-2 h-10">
                    Lütfen yüzünüzü dairenin içine ortalayın. Doğrulama otomatik olarak başlayacaktır.
                </p>
            )}
          </div>
        )}
      </CardContent>
       <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full justify-between">
            {step > 1 && <Button variant="outline" onClick={prevStep}>Geri</Button>}
            <div className="flex-grow" />
            {step < 3 && <Button onClick={nextStep} disabled={step === 2 && formData.hobbies.length < 3}>İleri</Button>}
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
