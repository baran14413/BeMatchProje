'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
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
import { Camera, UserCheck, AlertTriangle, Loader, Eye, EyeOff, Sparkles, Shuffle, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const HOBBIES = [
  'Müzik', 'Spor', 'Seyahat', 'Kitap Okumak', 'Film/Dizi', 
  'Yemek Yapmak', 'Oyun', 'Doğa Yürüyüşü', 'Sanat', 'Teknoloji'
];

const CAPTCHA_OPTIONS = [
  { icon: '❤️', name: 'kalp' },
  { icon: '⭐', name: 'yıldız' },
  { icon: '☀️', name: 'güneş' },
  { icon: '⚡', name: 'şimşek' },
];

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'fail';
type FailureReason = 'no_face' | 'gender_mismatch' | 'not_live';
type PasswordStrength = 'yok' | 'zayıf' | 'orta' | 'güçlü';


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
    profilePicture: null as string | null, // Changed to string for data URI
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('yok');
  
  const [captchaTarget, setCaptchaTarget] = useState(CAPTCHA_OPTIONS[0]);
  const [captchaSelected, setCaptchaSelected] = useState<string | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [failureReason, setFailureReason] = useState<FailureReason | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const captureFrame = () => {
    if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Flip the image horizontally to act as a mirror
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, 0, 0, -canvas.width, canvas.height);
            const frame = canvas.toDataURL('image/jpeg');
            setFormData(prev => ({...prev, profilePicture: frame}));
        }
    }
  }

  const handleVerification = () => {
    if (verificationStatus === 'verifying' || verificationStatus === 'success') return;
    setVerificationStatus('verifying');
    setFailureReason(null);
    if (verificationTimeoutRef.current) { clearTimeout(verificationTimeoutRef.current); }
    
    verificationTimeoutRef.current = setTimeout(() => {
        const mockFaceFound = Math.random() > 0.1; 
        const mockIsLive = Math.random() > 0.2; 
        // We'll simulate that the camera always detects a "male" for testing purposes.
        const mockDetectedGender = 'male'; 
        
        if (!mockFaceFound) { setFailureReason('no_face'); setVerificationStatus('fail'); return; }
        if (!mockIsLive) { setFailureReason('not_live'); setVerificationStatus('fail'); return; }

        // Check for gender mismatch only if a gender is selected
        if ((formData.gender === 'female' && mockDetectedGender === 'male') || (formData.gender === 'male' && mockDetectedGender === 'female')) {
            setFailureReason('gender_mismatch');
            setVerificationStatus('fail');
            toast({ variant: 'destructive', title: 'Cinsiyet Uyuşmazlığı', description: 'Belirttiğiniz cinsiyetle doğrulama eşleşmedi. 5 saniye içinde önceki adıma yönlendiriliyorsunuz.' });
            setTimeout(() => { 
                setVerificationStatus('idle'); 
                setFailureReason(null); 
                prevStep(); // Go to previous step (gender selection)
                prevStep(); // Go to previous step (age/hobbies)
                prevStep(); // Go to previous step (password)
                prevStep(); // Go to previous step (captcha)
            }, 5000);
            return;
        }

        setVerificationStatus('success');
        captureFrame(); // Capture the frame on success
        setTimeout(() => nextStep(), 1500); // Move to next step after success animation
    }, 3000); // 3-second simulation
  };
  
  const retryVerification = () => {
    setVerificationStatus('idle');
    setFailureReason(null);
    // Automatically restart verification
    handleVerification();
  };
  
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) { videoRef.current.srcObject = stream; }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Kamera Erişimi Reddedildi', description: 'Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin.' });
      }
    };
    if (step === 5) { getCameraPermission(); } 
    else {
      // Clean up camera stream when leaving the step
      if (verificationTimeoutRef.current) { clearTimeout(verificationTimeoutRef.current); }
      setVerificationStatus('idle');
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [step, toast]);
  
  // Auto-start verification when camera is ready
  useEffect(() => {
    if (step === 5 && hasCameraPermission && verificationStatus === 'idle') {
        handleVerification();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, hasCameraPermission, verificationStatus]);

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

  const shuffleCaptcha = () => {
    setCaptchaTarget(CAPTCHA_OPTIONS[Math.floor(Math.random() * CAPTCHA_OPTIONS.length)]);
    setCaptchaSelected(null);
  };

  useEffect(() => { if (step === 4) { shuffleCaptcha(); } }, [step]);

  const isStep1Invalid = !formData.firstName || !formData.lastName || !formData.username || !formData.email;
  const isStep2Invalid = !formData.age || !formData.gender || formData.hobbies.length < 3;
  const isStep3Invalid = !formData.password || formData.password !== formData.confirmPassword || passwordStrength === 'zayıf';
  const isStep4Invalid = captchaSelected !== captchaTarget.name;
  const isStep6Invalid = !formData.profilePicture;


  const isNextButtonDisabled = (currentStep: number) => {
    switch (currentStep) {
        case 1: return isStep1Invalid;
        case 2: return isStep2Invalid;
        case 3: return isStep3Invalid;
        case 4: return isStep4Invalid;
        default: return false;
    }
  };

  const progress = (step / 7) * 100;

  const getFailureMessage = () => {
    switch(failureReason) {
        case 'no_face': return 'Yüz algılanamadı. Lütfen yüzünüzü dairenin içine ortalayın.';
        case 'not_live': return 'Canlılık algılanamadı. Lütfen bir fotoğraf yerine kendinizi gösterin.';
        case 'gender_mismatch': return 'Cinsiyetinizle belirttiğiniz bilgi uyuşmuyor. Lütfen kontrol edin.';
        default: return 'Doğrulama başarısız oldu. Lütfen tekrar deneyin.';
    }
  }

  const getBorderColorClass = () => {
    switch (verificationStatus) {
        case 'verifying': return 'border-primary/50 animate-pulse';
        case 'success': return 'border-green-500';
        case 'fail': return 'border-destructive';
        default: return 'border-primary/50';
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
        case 'zayıf': return 'bg-red-500';
        case 'orta': return 'bg-yellow-500';
        case 'güçlü': return 'bg-green-500';
        default: return 'bg-muted';
    }
  };

  return (
    <Card className="w-full max-w-md">
       <CardHeader>
        <CardTitle className="text-2xl font-headline">Hesap Oluştur</CardTitle>
        <CardDescription>
          {step === 1 && "Kişisel bilgilerinizi girin."}
          {step === 2 && "Sizi daha iyi tanımamıza yardımcı olun."}
          {step === 3 && "Güçlü bir şifre oluşturun."}
          {step === 4 && "Doğrulamayı tamamlayın."}
          {step === 5 && "Kimliğinizi doğrulamak için yüzünüzü taratın."}
          {step === 6 && "Profil fotoğrafınızı onaylayın."}
        </CardDescription>
        <Progress value={progress} className="w-full mt-2" />
      </CardHeader>
      <CardContent className="min-h-[350px]">
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
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</Button>
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
            <p className="font-medium text-center">Doğrulama için lütfen <span className="font-bold text-primary">{captchaTarget.name}</span> ikonuna tıklayın.</p>
            <div className="flex gap-4 p-4 rounded-lg bg-muted">
              {CAPTCHA_OPTIONS.map((opt) => (<button key={opt.name} onClick={() => setCaptchaSelected(opt.name)} className={cn("text-4xl p-3 rounded-full transition-all duration-200", captchaSelected === opt.name ? 'bg-primary scale-110' : 'hover:bg-primary/20')}>{opt.icon}</button>))}
            </div>
             <Button type="button" variant="link" size="sm" onClick={shuffleCaptcha} className="gap-1"><Shuffle className="w-3 h-3"/> Farklı Sor</Button>
          </div>
        )}
        {step === 5 && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto">
                 <div className={`relative w-full h-full rounded-full bg-muted overflow-hidden flex items-center justify-center border-8 border-dashed transition-colors duration-500 ${getBorderColorClass()}`}>
                     <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                     {hasCameraPermission === false && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4"><Camera className="w-16 h-16 mb-4"/><p className="text-center font-medium">Kamera Erişimi Gerekli</p></div>)}
                    {verificationStatus === 'verifying' && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10"><Loader className="w-16 h-16 text-primary animate-spin"/><p className="mt-4 text-primary-foreground font-semibold">Doğrulanıyor...</p></div>)}
                    {verificationStatus === 'success' && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/80 z-10"><UserCheck className="w-16 h-16 text-white"/><p className="mt-4 text-white font-semibold">Doğrulama Başarılı</p></div>)}
                 </div>
            </div>
            {verificationStatus === 'fail' && (<Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>Doğrulama Başarısız</AlertTitle><AlertDescription>{getFailureMessage()}{failureReason !== 'gender_mismatch' && (<Button variant="link" className="p-0 h-auto mt-2" onClick={retryVerification}>Tekrar Dene</Button>)}</AlertDescription></Alert>)}
            {hasCameraPermission && verificationStatus !== 'fail' && (<p className="text-sm text-muted-foreground text-center mt-2 h-10">Lütfen yüzünüzü dairenin içine ortalayın. Doğrulama otomatik olarak başlayacaktır.</p>)}
          </div>
        )}
        {step === 6 && (
            <div className="flex flex-col items-center gap-4">
                <p className="font-medium text-center">Bu fotoğraf profil resminiz olarak kullanılacaktır.</p>
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-dashed border-primary/50">
                    {formData.profilePicture ? (
                        <img src={formData.profilePicture} alt="Profil fotoğrafı önizlemesi" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <p className="mt-2 text-sm">Doğrulama sırasında fotoğraf alınamadı.</p>
                        </div>
                    )}
                </div>
                 <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Onay</AlertTitle>
                    <AlertDescription>
                        Bu fotoğrafın profilinizde görünmesini onaylıyor musunuz?
                    </AlertDescription>
                </Alert>
            </div>
        )}
      </CardContent>
       <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full justify-between">
            {step > 1 && <Button variant="outline" onClick={prevStep}>Geri</Button>}
            <div className="flex-grow" />
            {step < 5 && <Button onClick={nextStep} disabled={isNextButtonDisabled(step)}>İleri</Button>}
            {step === 6 && <Button onClick={handleFinishSignup} disabled={isStep6Invalid}>Onayla ve Bitir</Button>}
        </div>
        <div className="mt-2 text-center text-sm">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="underline">Giriş Yap</Link>
        </div>
      </CardFooter>
    </Card>
  );
}
