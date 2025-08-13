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
import { X, Camera } from 'lucide-react';
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
    // Mock verification logic
    toast({
        title: "Doğrulama Başarılı!",
        description: "Hesabınız başarıyla oluşturuldu.",
    });
    router.push('/match');
  }

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const progress = (step / 3) * 100;

  return (
    <Card className="w-full max-w-md">
       <CardHeader>
        <CardTitle className="text-2xl font-headline">Hesap Oluştur</CardTitle>
        <CardDescription>
          {step === 1 && "Kişisel bilgilerinizi girin."}
          {step === 2 && "Sizi daha iyi tanımamıza yardımcı olun."}
          {step === 3 && "Kimliğinizi doğrulamak için kameranızı kullanın."}
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
            <div className="w-full aspect-video rounded-md bg-muted overflow-hidden relative flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {hasCameraPermission === false && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                        <Camera className="w-12 h-12 mb-2"/>
                        <p className="text-center">Lütfen yüzünüzü göstermek için kamera erişimine izin verin.</p>
                    </div>
                )}
            </div>
            {hasCameraPermission === false && (
                <Alert variant="destructive">
                    <AlertTitle>Kamera Erişimi Gerekli</AlertTitle>
                    <AlertDescription>
                       Bu özelliği kullanmak için lütfen kamera erişimine izin verin.
                    </AlertDescription>
                </Alert>
            )}
          </div>
        )}
      </CardContent>
       <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full justify-between">
            {step > 1 && <Button variant="outline" onClick={prevStep}>Geri</Button>}
            <div className="flex-grow" />
            {step < 3 && <Button onClick={nextStep}>İleri</Button>}
            {step === 3 && <Button onClick={handleVerification} disabled={!hasCameraPermission}>Doğrula ve Bitir</Button>}
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
