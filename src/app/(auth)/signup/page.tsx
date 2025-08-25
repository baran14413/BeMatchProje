
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
import { Camera, AlertTriangle, Loader2, Eye, EyeOff, Sparkles, Ban, Upload, ShieldCheck, UserCheck, Check, CircleX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { moderateImage, ModerateImageOutput } from '@/ai/flows/moderate-image-flow';
import Image from 'next/image';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { cities, districts } from '@/lib/turkey-locations';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from 'use-debounce';

const HOBBIES = [
  'Müzik', 'Spor', 'Seyahat', 'Kitap Okumak', 'Film/Dizi',
  'Yemek Yapmak', 'Oyun', 'Doğa Yürüyüşü', 'Sanat', 'Teknoloji'
];

type PasswordStrength = 'yok' | 'zayıf' | 'orta' | 'güçlü';
type ModerationStatus = 'idle' | 'checking' | 'safe' | 'unsafe';
type VerificationStatus = 'idle' | 'checking' | 'verified' | 'failed';
type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    age: '',
    gender: '',
    country: '',
    city: '',
    district: '',
    hobbies: [] as string[],
    password: '',
    confirmPassword: '',
    bio: '',
    profilePicture: null as string | null,
  });

  const [debouncedUsername] = useDebounce(formData.username, 500);
  const [debouncedEmail] = useDebounce(formData.email, 500);
  
  const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>('idle');
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>('idle');
  
  const [selectedCityPlate, setSelectedCityPlate] = useState<number | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('yok');

  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>('idle');
  const [moderationResult, setModerationResult] = useState<ModerateImageOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const bioMaxLength = 250;

  useEffect(() => {
    const checkUsername = async () => {
      if (debouncedUsername.length < 3) {
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus('checking');
      const q = query(collection(db, 'users'), where('username', '==', debouncedUsername));
      const querySnapshot = await getDocs(q);
      setUsernameStatus(querySnapshot.empty ? 'available' : 'taken');
    };
    if(debouncedUsername) checkUsername();
  }, [debouncedUsername]);

  useEffect(() => {
    const checkEmail = async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!debouncedEmail || !emailRegex.test(debouncedEmail)) {
        setEmailStatus('idle');
        return;
      }
      setEmailStatus('checking');
      const q = query(collection(db, 'users'), where('email', '==', debouncedEmail));
      const querySnapshot = await getDocs(q);
      setEmailStatus(querySnapshot.empty ? 'available' : 'taken');
    };
    if(debouncedEmail) checkEmail();
  }, [debouncedEmail]);
  

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);
  
  
  useEffect(() => {
    if (step === 6) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              setVerificationStatus('verified'); // Simulate verification on stream start
            };
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          toast({
            variant: 'destructive',
            title: 'Kamera İzni Reddedildi',
            description: 'Yüz doğrulama için kamera izni vermeniz gerekiyor.',
          });
        }
      };
      getCameraPermission();

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'username') {
      setUsernameStatus('idle');
      const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setFormData(prev => ({ ...prev, [id]: sanitizedValue }));
    } else if (id === 'email') {
      setEmailStatus('idle');
      setFormData(prev => ({...prev, [id]: value}));
    } else if (id === 'bio' && value.length > bioMaxLength) {
        return;
    } else {
        setFormData((prev) => ({ ...prev, [id]: value }));
    }
    if (id === 'password') { checkPasswordStrength(value); }
  };

  const handleFinishSignup = async () => {
      setIsFinishing(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        let photoURL = 'https://placehold.co/128x128.png';
        if (formData.profilePicture) {
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);
            await uploadString(storageRef, formData.profilePicture, 'data_url');
            photoURL = await getDownloadURL(storageRef);
        }
        
        await updateProfile(user, {
            displayName: `${formData.firstName} ${formData.lastName}`,
            photoURL: photoURL
        });

        const { password, confirmPassword, profilePicture, ...userDataToSave } = formData;

        await setDoc(doc(db, 'users', user.uid), {
            ...userDataToSave,
            name: `${formData.firstName} ${formData.lastName}`,
            uid: user.uid,
            avatarUrl: photoURL,
            createdAt: new Date().toISOString(),
        });
        
        toast({
            title: "Hesap Oluşturuldu!",
            description: "Harika, aramıza hoş geldin! Uygulama turuna yönlendiriliyorsun...",
            className: "bg-green-500 text-white",
        });
        router.push('/tutorial');

      } catch (error: any) {
        console.error("Signup error: ", error);
        let description = "Bir hata oluştu, lütfen bilgilerinizi kontrol edip tekrar deneyin.";
        if (error.code === 'auth/email-already-in-use' || error.message?.includes('email-already-in-use')) {
            description = "Bu e-posta adresi zaten kullanımda. Lütfen farklı bir e-posta deneyin veya giriş yapın.";
        }
        toast({
            variant: "destructive",
            title: "Kayıt Başarısız",
            description: description,
        });
      } finally {
        setIsFinishing(false);
      }
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

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === 'city') {
        const city = cities.find(c => c.name === value);
        setSelectedCityPlate(city ? city.id : null);
        setFormData(prev => ({...prev, district: ''}));
    }
  };
  
  const toggleHobby = (hobby: string) => {
    setFormData((prev) => {
      const newHobbies = prev.hobbies.includes(hobby) ? prev.hobbies.filter((h) => h !== hobby) : [...prev.hobbies, hobby];
      return { ...prev, hobbies: newHobbies };
    });
  };

  const isStep1Invalid = !formData.firstName || !formData.lastName || !formData.username || !formData.email || usernameStatus === 'taken' || emailStatus === 'taken' || usernameStatus === 'checking' || emailStatus === 'checking';
  const isStep2Invalid = !formData.age || !formData.gender || !formData.country || !formData.city || !formData.district || formData.hobbies.length < 3;
  const isStep3Invalid = !formData.password || formData.password !== formData.confirmPassword || passwordStrength === 'zayıf';
  const isStep4Invalid = !formData.bio;
  const isStep5Invalid = false; // Step 5 is profile picture, can be skipped
  const isStep6Invalid = verificationStatus !== 'verified';

  const isNextButtonDisabled = () => {
    switch (step) {
        case 1: return isStep1Invalid;
        case 2: return isStep2Invalid;
        case 3: return isStep3Invalid;
        case 4: return isStep4Invalid;
        case 5: return isStep5Invalid;
        default: return false;
    }
  };
  
  const handlePhotoSkip = () => {
    setFormData(prev => ({...prev, profilePicture: null}));
    setModerationStatus('idle');
    setModerationResult(null);
    nextStep();
  }
  
  const handleNextPhotoStep = () => {
      if (moderationStatus === 'safe' && formData.profilePicture) {
          nextStep();
      } else {
           toast({
            variant: "destructive",
            title: "Devam Edilemiyor",
            description: "Lütfen devam etmeden önce geçerli bir fotoğrafı denetleyin."
        });
      }
  }

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
  
  const renderStatusIcon = (status: AvailabilityStatus) => {
    if (status === 'checking') {
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (status === 'taken') {
        return <CircleX className="w-4 h-4 text-destructive" />;
    }
    if (status === 'available') {
        return <Check className="w-4 h-4 text-green-500" />;
    }
    return null;
  }

  return (
    <Card className="w-full max-w-md">
       <CardHeader>
        <CardTitle className="text-2xl font-headline">Hesap Oluştur</CardTitle>
        <CardDescription>
          {step === 1 && "Adım 1: Kişisel bilgilerinizi girin."}
          {step === 2 && "Adım 2: Sizi daha iyi tanımamıza yardımcı olun."}
          {step === 3 && "Adım 3: Güçlü bir şifre oluşturun."}
          {step === 4 && "Adım 4: Kendinizi tanıtın."}
          {step === 5 && "Adım 5: Profil fotoğrafınızı yükleyin."}
          {step === 6 && "Adım 6: Neredeyse bitti! Son bir onay."}
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
              <div className="relative">
                <Input id="username" placeholder="canyilmaz" value={formData.username} onChange={handleChange} required className="pr-8"/>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {renderStatusIcon(usernameStatus)}
                </div>
              </div>
              {usernameStatus === 'taken' && <p className="text-xs text-destructive mt-1">Bu kullanıcı adı kullanımda.</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Input id="email" type="email" placeholder="ornek@mail.com" value={formData.email} onChange={handleChange} required className="pr-8"/>
                 <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {renderStatusIcon(emailStatus)}
                </div>
              </div>
              {emailStatus === 'taken' && <p className="text-xs text-destructive mt-1">Bu e-posta adresi kullanımda.</p>}
            </div>
          </div>
        )}
        {step === 2 && (
            <div className="grid gap-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="age">Yaş</Label>
                        <Input id="age" type="number" placeholder="25" value={formData.age} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="gender">Cinsiyet</Label>
                        <Select onValueChange={(v) => handleSelectChange('gender', v)} value={formData.gender}>
                            <SelectTrigger id="gender"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="female">Kadın</SelectItem>
                                <SelectItem value="male">Erkek</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-2 pl-1">Seçtiğiniz cinsiyet, bir sonraki adımda yüz doğrulaması ile teyit edilecektir.</p>
                <div className="grid gap-2">
                    <Label htmlFor="country">Ülke</Label>
                     <Select onValueChange={(v) => handleSelectChange('country', v)} value={formData.country}>
                        <SelectTrigger id="country"><SelectValue placeholder="Ülke Seçiniz" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Türkiye">Türkiye</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 {formData.country === 'Türkiye' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="city">Şehir</Label>
                            <Select onValueChange={(v) => handleSelectChange('city', v)} value={formData.city}>
                                <SelectTrigger id="city"><SelectValue placeholder="İl Seçiniz" /></SelectTrigger>
                                <SelectContent>
                                    {cities.map(city => <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="district">İlçe</Label>
                            <Select onValueChange={(v) => handleSelectChange('district', v)} value={formData.district} disabled={!selectedCityPlate}>
                                <SelectTrigger id="district"><SelectValue placeholder="İlçe Seçiniz" /></SelectTrigger>
                                <SelectContent>
                                    {selectedCityPlate && districts[selectedCityPlate]?.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                 )}
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
             <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                    <Label htmlFor="bio">Hakkımda</Label>
                    <span className="text-xs text-muted-foreground">
                        {formData.bio.length} / {bioMaxLength}
                    </span>
                </div>
                <Textarea 
                    id="bio"
                    placeholder="Kendinden kısaca bahset..."
                    value={formData.bio} 
                    onChange={handleChange}
                    maxLength={bioMaxLength}
                    className="min-h-[200px]" 
                />
            </div>
        )}
        {step === 5 && (
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
                  {moderationStatus === 'checking' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {moderationStatus === 'checking' ? 'Denetleniyor...' : 'Fotoğrafı Denetle'}
                </Button>
              )}

              {moderationStatus === 'unsafe' && (
                <Alert variant="destructive" className="mt-4">
                  <Ban className="h-4 h-4" />
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
        {step === 6 && (
            <div className="flex flex-col items-center gap-4">
              <p className="font-medium text-center">Canlılık kontrolü için lütfen kameraya bakın.</p>
               <div className={cn(
                   "relative w-64 h-64 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 transition-colors",
                   getVerificationBorderColor()
               )}>
                 <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                  {verificationStatus === 'checking' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                          <Loader2 className="w-12 h-12 mb-2 animate-spin"/>
                          <p>Doğrulanıyor...</p>
                      </div>
                  )}
               </div>

                {verificationStatus === 'failed' && (
                    <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Doğrulama Başarısız</AlertTitle>
                    <AlertDescription>
                        Yüz doğrulanamadı. Lütfen tekrar deneyin.
                    </AlertDescription>
                    </Alert>
                )}
                {verificationStatus === 'verified' && (
                    <div className="flex flex-col items-center gap-4 mt-4">
                        <Alert className="border-green-500 text-green-700 dark:text-green-400">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <AlertTitle>Doğrulama Başarılı!</AlertTitle>
                        <AlertDescription>
                           Harika! Neredeyse bitti.
                        </AlertDescription>
                        </Alert>
                        <div className="flex items-center space-x-2 pt-4">
                            <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                            <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                                Hesabını oluşturarak <Link href="#" className="underline">Kullanım Koşullarımızı</Link> ve <Link href="#" className="underline">Gizlilik Politikamızı</Link> kabul etmiş olursun.
                            </Label>
                        </div>
                    </div>
                )}
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={prevStep} disabled={isFinishing}>Geri</Button>
        ) : (
             <div className="mt-4 text-center text-sm">
                Zaten bir hesabın var mı?{' '}
                <Link href="/login" className="underline">
                Giriş Yap
                </Link>
            </div>
        )}
        {step < 5 ? (
          <Button onClick={nextStep} disabled={isNextButtonDisabled()}>İleri</Button>
        ) : step === 5 ? (
           <div className="flex gap-2">
                <Button variant="secondary" onClick={handlePhotoSkip}>Bu Adımı Atla</Button>
                <Button onClick={handleNextPhotoStep} disabled={moderationStatus !== 'safe'}>İleri</Button>
            </div>
        ) : step === 6 ? (
             <Button onClick={handleFinishSignup} disabled={isFinishing || !termsAccepted || verificationStatus !== 'verified'}>
                {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bitir ve Keşfet
            </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
