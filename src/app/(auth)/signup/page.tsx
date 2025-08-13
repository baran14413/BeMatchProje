'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
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
import { Camera, AlertTriangle, Loader, Eye, EyeOff, Sparkles, Ban, Upload, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { moderateImage, ModerateImageOutput } from '@/ai/flows/moderate-image-flow';
import Image from 'next/image';

const HOBBIES = [
  'Müzik', 'Spor', 'Seyahat', 'Kitap Okumak', 'Film/Dizi',
  'Yemek Yapmak', 'Oyun', 'Doğa Yürüyüşü', 'Sanat', 'Teknoloji'
];

type PasswordStrength = 'yok' | 'zayıf' | 'orta' | 'güçlü';
type ModerationStatus = 'idle' | 'checking' | 'safe' | 'unsafe';
type VerificationStatus = 'idle' | 'checking' | 'verified' | 'failed';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    age: '',
    gender: '',
    hobbies: [] as string[],
    password: '',
    confirmPassword: '',
    profilePicture: null as string | null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('yok');

  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>('idle');
  const [moderationResult, setModerationResult] = useState<ModerateImageOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const startVerification = () => {
      setVerificationStatus('checking');
      setVerificationError(null);

      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }

      // Simulate a successful verification for the chosen gender.
      verificationTimeoutRef.current = setTimeout(() => {
        setVerificationStatus('verified');
        setTimeout(() => nextStep(), 1500); // Wait a bit on success then proceed
      }, 2000); // Simulate a 2-second check
  };

  useEffect(() => {
    if (step === 5) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Wait for video to be ready and start verification
            videoRef.current.onloadedmetadata = () => {
              startVerification();
            };
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Kamera İzni Reddedildi',
            description: 'Yüz doğrulama için kamera izni vermeniz gerekiyor.',
          });
        }
      };
      getCameraPermission();

      return () => {
        // Cleanup stream and timeouts on component unmount or step change
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        if (verificationTimeoutRef.current) {
          clearTimeout(verificationTimeoutRef.current);
        }
      };
    }
  }, [step, toast]);


  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setModerationStatus('idle');
      setModerationResult(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUri = event.target?.result as string;
        setFormData((prev) => ({ ...prev, profilePicture: dataUri }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModerateImage = async () => {
    if (!formData.profilePicture) return;
    setModerationStatus('checking');
    try {
      const result = await moderateImage({ photoDataUri: formData.profilePicture });
      setModerationResult(result);
      if (result.isSafe) {
        setModerationStatus('safe');
      } else {
        setModerationStatus('unsafe');
      }
    } catch (error) {
      console.error("Moderation failed", error);
      toast({
        variant: 'destructive',
        title: 'Denetleme Başarısız',
        description: 'Fotoğraf denetlenirken bir hata oluştu. Lütfen tekrar deneyin.'
      });
      setModerationStatus('idle');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === 'password') { checkPasswordStrength(value); }
  };

  const handleFinishSignup = () => {
      toast({
          title: "Hesap Oluşturuldu!",
          description: "Harika, aramıza hoş geldin! Eşleşme sayfasına yönlendiriliyorsun...",
          className: "bg-green-500 text-white",
      });
      router.push('/match');
  };

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length > 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length === 0) { setPasswordStrength('yok'); }
    else if (score < 2) { setPasswordStrength('zayıf'); }
    else if (score < 4) { setPasswordStrength('orta'); }
    else { setPasswordStrength('güçlü'); }
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 12; i++) { password += chars.charAt(Math.floor(Math.random() * chars.length)); }
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
    checkPasswordStrength(password);
  };

  const handleGenderChange = (value: string) => setFormData((prev) => ({ ...prev, gender: value }));
  const toggleHobby = (hobby: string) => {
    setFormData((prev) => {
      const newHobbies = prev.hobbies.includes(hobby) ? prev.hobbies.filter((h) => h !== hobby) : [...prev.hobbies, hobby];
      return { ...prev, hobbies: newHobbies };
    });
  };

  const isStep1Invalid = !formData.firstName || !formData.lastName || !formData.username || !formData.email;
  const isStep2Invalid = !formData.age || !formData.gender || formData.hobbies.length < 3;
  const isStep3Invalid = !formData.password || formData.password !== formData.confirmPassword || passwordStrength === 'zayıf';
  const isStep4Invalid = !formData.profilePicture || moderationStatus !== 'safe';
  const isStep5Invalid = verificationStatus !== 'verified';

  const isNextButtonDisabled = () => {
    switch (step) {
        case 1: return isStep1Invalid;
        case 2: return isStep2Invalid;
        case 3: return isStep3Invalid;
        case 4: return isStep4Invalid;
        // Step 5 is automatic, but we keep the logic just in case.
        case 5: return isStep5Invalid;
        default: return false;
    }
  };

  const progress = (step / 6) * 100;

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
        case 'zayıf': return 'bg-red-500';
        case 'orta': return 'bg-yellow-500';
        case 'güçlü': return 'bg-green-500';
        default: return 'bg-muted';
    }
  };

  const getVerificationBorderColor = () => {
      if (verificationStatus === 'verified') return 'border-green-500';
      if (verificationStatus === 'failed') return 'border-red-500';
      if (verificationStatus === 'checking') return 'border-yellow-500 animate-pulse';
      return 'border-primary/50';
  };

  return (
    <Card className="w-full max-w-md">
       <CardHeader>
        <CardTitle className="text-2xl font-headline">Hesap Oluştur</CardTitle>
        <CardDescription>
          {step === 1 && "Adım 1: Kişisel bilgilerinizi girin."}
          {step === 2 && "Adım 2: Sizi daha iyi tanımamıza yardımcı olun."}
          {step === 3 && "Adım 3: Güçlü bir şifre oluşturun."}
          {step === 4 && "Adım 4: Profil fotoğrafınızı yükleyin."}
          {step === 5 && "Adım 5: Canlılık kontrolü için yüzünüzü doğrulayın."}
          {step === 6 && "Adım 6: Neredeyse bitti!"}
        </CardDescription>
        <Progress value={progress} className="w-full mt-2" />
      </CardHeader>
      <CardContent className="min-h-[400px]">
        {step === 1 && (
          <div className="grid gap-4">
            <div className='grid grid-cols-2 gap-4'>
                <div className="grid gap-2">
                    <Label htmlFor="firstName">Ad</Label>
                    <Input id="firstName" placeholder="Can" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <Input id="lastName" placeholder="Yılmaz" value={formData.lastName} onChange={handleChange} required />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input id="username" placeholder="canyilmaz" value={formData.username} onChange={handleChange} required />
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
                        <SelectTrigger id="gender"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
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
                        {HOBBIES.map((hobby) => (<Badge key={hobby} variant={formData.hobbies.includes(hobby) ? 'default' : 'secondary'} onClick={() => toggleHobby(hobby)} className="cursor-pointer">{hobby}</Badge>))}
                    </div>
                </div>
            </div>
        )}
        {step === 3 && (
            <div className="grid gap-4">
                <div className="grid gap-2 relative">
                    <Label htmlFor="password">Şifre</Label>
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                </div>
                 <div className="grid grid-cols-3 items-center gap-2">
                    <div className={cn("h-2 rounded-full", getPasswordStrengthColor())}></div>
                    <div className={cn("h-2 rounded-full", passwordStrength === 'orta' || passwordStrength === 'güçlü' ? getPasswordStrengthColor() : 'bg-muted')}></div>
                    <div className={cn("h-2 rounded-full", passwordStrength === 'güçlü' ? getPasswordStrengthColor() : 'bg-muted')}></div>
                </div>
                <div className='flex justify-between items-center'>
                     <p className='text-xs text-muted-foreground'>
                        {passwordStrength === 'yok' && 'Şifre girin.'}
                        {passwordStrength === 'zayıf' && 'Şifre zayıf.'}
                        {passwordStrength === 'orta' && 'Şifre orta seviyede.'}
                        {passwordStrength === 'güçlü' && 'Şifre güçlü.'}
                    </p>
                    <Button type="button" variant="link" size="sm" onClick={generateStrongPassword} className="gap-1 p-0 h-auto"><Sparkles className="w-3 h-3"/> Öneri</Button>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                    <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (<p className="text-sm text-destructive">Şifreler eşleşmiyor.</p>)}
            </div>
        )}
        {step === 4 && (
            <div className="flex flex-col items-center gap-4">
              <p className="font-medium text-center">Lütfen profil fotoğrafınızı yükleyin.</p>
              <div
                className="relative w-48 h-48 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-dashed border-primary/50 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                  <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleProfilePictureChange}
                  />
                  {formData.profilePicture ? (
                    <Image src={formData.profilePicture} alt="Profil fotoğrafı önizlemesi" layout="fill" objectFit="cover" />
                  ) : (
                    <div className="text-center text-muted-foreground p-4 flex flex-col items-center">
                        <Upload className="w-12 h-12 mb-2" />
                        <p className="text-sm">Fotoğraf Yükle</p>
                    </div>
                  )}
              </div>

              {formData.profilePicture && (
                <Button onClick={handleModerateImage} disabled={moderationStatus === 'checking'}>
                  {moderationStatus === 'checking' && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  {moderationStatus === 'checking' ? 'Denetleniyor...' : 'Fotoğrafı Denetle'}
                </Button>
              )}

              {moderationStatus === 'unsafe' && (
                <Alert variant="destructive" className="mt-4">
                  <Ban className="h-4 w-4" />
                  <AlertTitle>Uygunsuz İçerik Tespit Edildi</AlertTitle>
                  <AlertDescription>
                    {moderationResult?.reason || 'Lütfen kurallarımıza uygun başka bir fotoğraf yükleyin.'}
                  </AlertDescription>
                </Alert>
              )}
              {moderationStatus === 'safe' && (
                <Alert variant="default" className="mt-4 border-green-500 text-green-700">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <AlertTitle>Fotoğraf Uygun</AlertTitle>
                  <AlertDescription>
                    Harika bir seçim! Devam etmek için ileri'ye tıkla.
                  </AlertDescription>
                </Alert>
              )}
            </div>
        )}
        {step === 5 && (
            <div className="flex flex-col items-center gap-4">
              <p className="font-medium text-center">Doğrulama için lütfen kameraya bakın.</p>
               <div className={cn(
                   "relative w-64 h-64 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 transition-colors",
                   getVerificationBorderColor()
               )}>
                 <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                  {!hasCameraPermission && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                          <Camera className="w-12 h-12 mb-2"/>
                          <p>Kamera izni bekleniyor...</p>
                      </div>
                  )}
                  {verificationStatus === 'checking' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                          <Loader className="w-12 h-12 mb-2 animate-spin"/>
                          <p>Doğrulanıyor...</p>
                      </div>
                  )}
               </div>

              {verificationStatus === 'failed' && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Doğrulama Başarısız</AlertTitle>
                  <AlertDescription>
                    {verificationError || 'Bir hata oluştu.'}
                    <br />
                    Cinsiyet seçimi sayfasına yönlendiriliyorsunuz...
                  </AlertDescription>
                </Alert>
              )}
              {verificationStatus === 'verified' && (
                <Alert variant="default" className="mt-4 border-green-500 text-green-700">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <AlertTitle>Doğrulama Başarılı</AlertTitle>
                  <AlertDescription>
                    Harika! Son adıma yönlendiriliyorsunuz...
                  </AlertDescription>
                </Alert>
              )}
            </div>
        )}
        {step === 6 && (
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <ShieldCheck className="w-24 h-24 text-green-500" />
            <h2 className="text-2xl font-bold font-headline">Kayıt Tamamlanmak Üzere</h2>
            <p className="text-muted-foreground">
             Tüm adımları başarıyla tamamladınız. BeMatch'e hoş geldiniz!
            </p>
            <p className="text-muted-foreground">
              Hesabınızı oluşturmak ve eşleşmeye başlamak için "Kaydı Bitir" butonuna tıklayın.
            </p>
          </div>
        )}

      </CardContent>
       <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full justify-between">
            {step > 1 && step !== 5 && <Button variant="outline" onClick={prevStep}>Geri</Button>}
            <div className="flex-grow" />
            {step < 5 && <Button onClick={nextStep} disabled={isNextButtonDisabled()}>İleri</Button>}
            {step === 6 && <Button onClick={handleFinishSignup}>Kaydı Bitir</Button>}
        </div>
        <div className="mt-2 text-center text-sm">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="underline">Giriş Yap</Link>
        </div>
      </CardFooter>
    </Card>
  );
}
