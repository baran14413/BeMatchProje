
'use client';

import { useState, useRef, ChangeEvent, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Camera, AlertTriangle, Loader2, Eye, EyeOff, Sparkles, Ban, Upload, ShieldCheck, UserCheck, Check, CircleX, Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { cities, districts } from '@/config/turkey-locations';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const HOBBIES = [
  'Müzik', 'Spor', 'Seyahat', 'Kitap Okumak', 'Film/Dizi',
  'Yemek Yapmak', 'Oyun', 'Doğa Yürüyüşü', 'Sanat', 'Teknoloji'
];

type PasswordStrength = 'yok' | 'zayıf' | 'orta' | 'güçlü';
type VerificationStatus = 'idle' | 'checking' | 'verified' | 'failed';

function SignUpComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<'email' | 'google'>('email');

  const [isFinishing, setIsFinishing] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const [selectedCityPlate, setSelectedCityPlate] = useState<number | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('yok');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const bioMaxLength = 250;

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);
  
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    const stepParam = searchParams.get('step');
    const sourceParam = searchParams.get('source');
    
    if (sourceParam === 'google') {
      const googleInfoStr = sessionStorage.getItem('googleSignUpInfo');
      if (googleInfoStr) {
        const googleInfo = JSON.parse(googleInfoStr);
        setFormData(prev => ({
          ...prev,
          email: googleInfo.email,
          firstName: googleInfo.firstName,
          lastName: googleInfo.lastName,
          profilePicture: googleInfo.photoURL,
        }));
        setSource('google');
        if (stepParam) {
            setStep(parseInt(stepParam, 10));
        }
      } else {
        router.push('/login');
      }
    } else {
       if (stepParam) {
            setStep(parseInt(stepParam, 10));
        }
    }
  }, [searchParams, router]);


  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUri = event.target?.result as string;
        setFormData((prev) => ({ ...prev, profilePicture: dataUri }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { id, value } = e.target;
    
    if (id === 'bio' && value.length > bioMaxLength) {
        return;
    }

    if (id === 'username') {
      value = value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    }
    
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === 'password') { checkPasswordStrength(value); }
  };

  const handleFinishSignup = async () => {
      setIsFinishing(true);
      try {
        let user = auth.currentUser;
        
        if (source === 'email' && !user) {
          const emailQuery = query(collection(db, 'users'), where('email', '==', formData.email));
          const emailSnapshot = await getDocs(emailQuery);
          if (!emailSnapshot.empty) {
              toast({ variant: "destructive", title: "E-posta Kullanımda", description: "Bu e-posta adresi zaten kullanılıyor. Lütfen farklı bir e-posta ile deneyin veya giriş yapın." });
              throw new Error("Email in use");
          }
        }
        
        const usernameQuery = query(collection(db, 'users'), where('username', '==', formData.username));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
            const userDoc = usernameSnapshot.docs[0];
            // If it's a google user completing their profile, the username might exist on their own doc
             if (source === 'google' && user && userDoc.id === user.uid) {
                // This is fine, it's the same user.
            } else {
                 toast({ variant: "destructive", title: "Kullanıcı Adı Alınmış", description: "Bu kullanıcı adı zaten alınmış. Lütfen geri giderek farklı bir kullanıcı adı seçin." });
                throw new Error("Username taken");
            }
        }

        if (source === 'email' && !user) {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            user = userCredential.user;
        }

        if (!user) {
             throw new Error("User authentication failed.");
        }
        
        let photoURL = formData.profilePicture || user.photoURL || '';
        if (formData.profilePicture && (formData.profilePicture !== user.photoURL)) {
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
            createdAt: serverTimestamp(),
            isPremium: false,
            stats: { followers: 0, following: 0 }
        }, { merge: true });
        
        sessionStorage.removeItem('googleSignUpInfo');
        
        toast({
            title: "Hesap Oluşturuldu!",
            description: "Harika, aramıza hoş geldin! Uygulama turuna yönlendiriliyorsun...",
            className: "bg-green-500 text-white",
        });
        router.push('/tutorial');

      } catch (error: any) {
        console.error("Signup error: ", error);
        if (error.message !== "Username taken" && error.message !== "Email in use") {
             toast({
                variant: "destructive",
                title: "Kayıt Başarısız",
                description: error.message || "Bir hata oluştu, lütfen bilgilerinizi kontrol edip tekrar deneyin.",
            });
        }
      } finally {
        setIsFinishing(false);
      }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
             toast({
                title: `Tekrar Hoş Geldin, ${user.displayName?.split(' ')[0]}!`,
                description: 'Bu hesapla zaten kayıtlısınız.',
                className: "bg-green-500 text-white",
            });
            router.push('/match');
        } else {
             const googleInfo = {
                email: user.email,
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                photoURL: user.photoURL,
            };
            sessionStorage.setItem('googleSignUpInfo', JSON.stringify(googleInfo));
            setSource('google');
            setFormData(prev => ({
                ...prev,
                ...googleInfo
            }));
            nextStep(); // Move to the username selection step
        }

    } catch (error: any) {
        console.error("Google sign-in error", error);
        toast({
            variant: "destructive",
            title: "Google ile Giriş Başarısız",
            description: "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin."
        });
    } finally {
        setIsGoogleLoading(false);
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

  const isStep1Invalid = source === 'email' ? (!formData.firstName || !formData.lastName || !formData.username || !formData.email) : (!formData.username);
  const isStep2Invalid = !formData.age || !formData.gender || !formData.country || !formData.city || !formData.district || formData.hobbies.length < 3;
  const isStep3Invalid = source === 'email' ? (!formData.password || formData.password !== formData.confirmPassword || passwordStrength === 'zayıf') : false;
  const isStep4Invalid = !formData.bio;
  const isStep5Invalid = !termsAccepted;


  const isNextButtonDisabled = () => {
    let currentStepForGoogle = step;
    if(source === 'google') {
        if(step >= 3) currentStepForGoogle = step + 1;
    }
    
    switch (currentStepForGoogle) {
        case 1: return isStep1Invalid;
        case 2: return isStep2Invalid;
        case 3: return isStep3Invalid;
        case 4: return isStep4Invalid;
        default: return false;
    }
  };
  
  const handlePhotoSkip = () => {
    setFormData(prev => ({...prev, profilePicture: null}));
    nextStep();
  }

  const progress = (step / (source === 'google' ? 4 : 6)) * 100;

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
        case 'zayıf': return 'bg-red-500';
        case 'orta': return 'bg-yellow-500';
        case 'güçlü': return 'bg-green-500';
        default: return 'bg-muted';
    }
  };

  const handleBack = () => {
      if (source === 'google' && step === 1) {
          router.push('/login');
      } else {
          prevStep();
      }
  }

  const renderEmailFlowStep1 = () => (
    <div className="grid gap-4">
          <Button variant="outline" type="button" onClick={handleGoogleSignIn} disabled={isFinishing || isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8 0 123.8 111.8 12.8 244 12.8c70.3 0 129.8 27.8 174.9 71.9l-63.5 61.9C325 110.8 287.1 89.6 244 89.6c-94.8 0-172.2 77.4-172.2 172.2s77.4 172.2 172.2 172.2c99.3 0 148.9-72.3 155.8-109.9H244V261.8h244z"></path></svg>}
            Google ile Kayıt Ol
        </Button>
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                Veya e-posta ile
                </span>
            </div>
        </div>
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
              <Input id="username" placeholder="canyilmaz" value={formData.username} onChange={handleChange} required />
          </div>
          <p className="text-xs text-muted-foreground pl-1">Sadece küçük harfler, rakamlar, '.' ve '_' kullanılabilir.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">E-posta</Label>
          <div className="relative">
              <Input id="email" type="email" placeholder="ornek@mail.com" value={formData.email} onChange={handleChange} required />
          </div>
        </div>
    </div>
  );

  const renderGoogleFlowStep1 = () => (
    <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Kullanıcı Adı</Label>
          <Input id="username" placeholder="canyilmaz" value={formData.username} onChange={handleChange} required />
          <p className="text-xs text-muted-foreground pl-1">Sadece küçük harfler, rakamlar, '.' ve '_' kullanılabilir.</p>
        </div>
        <div className="grid gap-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" value={formData.email} disabled />
        </div>
    </div>
  );
  
  const finalStep = source === 'google' ? 4 : 5;
  
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <Heart className="w-20 h-20 text-primary animate-pulse-heart" />
            <h1 className="text-4xl font-bold font-headline text-foreground">BeMatch</h1>
            <p className="text-muted-foreground">Yeni bir başlangıç yap.</p>
        </div>
        <Card className="w-full bg-card/80 backdrop-blur-sm border-border/20 shadow-xl">
        <CardHeader>
            <CardTitle className="text-2xl font-headline text-foreground">Hesap Oluştur</CardTitle>
            <Progress value={progress} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="min-h-[400px]">
            {step === 1 && (source === 'email' ? renderEmailFlowStep1() : renderGoogleFlowStep1())}
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
            {step === 3 && source === 'email' && (
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
            {step === (source === 'google' ? 3 : 4) && (
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
            {step === (source === 'google' ? 4 : 5) && (
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
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Topluluk Kuralları</AlertTitle>
                        <AlertDescription>
                          Yüklediğiniz fotoğrafın çıplaklık, argo, küfür, şiddet veya nefret söylemi içermediğinden emin olun.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {step === finalStep && (
                 <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                    <Heart className="w-20 h-20 text-primary animate-pulse-heart" />
                    <h2 className="text-2xl font-bold">Neredeyse Bitti!</h2>
                    <p className="text-muted-foreground">
                        Hesabını oluşturmak için lütfen şartlarımızı ve koşullarımızı kabul et.
                    </p>
                    <div className="flex items-center space-x-2 pt-4">
                        <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                        <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                            Hesabını oluşturarak <Link href="#" className="underline">Kullanım Koşullarımızı</Link> ve <Link href="#" className="underline">Gizlilik Politikamızı</Link> kabul etmiş olursun.
                        </Label>
                    </div>
                </div>
            )}

        </CardContent>
        <CardFooter className="flex justify-between">
            {step > 1 || (source === 'google' && step ===1) ? (
            <Button variant="outline" onClick={handleBack} disabled={isFinishing}>Geri</Button>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Zaten bir hesabın var mı?{' '}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                    Giriş Yap
                    </Link>
                </p>
            )}
            
            {(step < finalStep) ? (
                (step === (source === 'google' ? 4 : 5)) ? (
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handlePhotoSkip}>Bu Adımı Atla</Button>
                        <Button onClick={nextStep} disabled={!formData.profilePicture}>İleri</Button>
                    </div>
                ) : (
                    <Button onClick={nextStep} disabled={isNextButtonDisabled()}>İleri</Button>
                )
            ) : (
                 <Button onClick={handleFinishSignup} disabled={isFinishing || isStep5Invalid}>
                    {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Bitir ve Keşfet
                </Button>
            )}

        </CardFooter>
        </Card>
    </div>
  );
}


export default function SignupPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <SignUpComponent />
        </Suspense>
    )
}
