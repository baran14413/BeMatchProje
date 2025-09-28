
'use client';

import { useState } from 'react';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Heart } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import AnimatedLogo from '@/components/ui/animated-logo';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const googleProvider = new GoogleAuthProvider();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Giriş Başarılı!',
        className: 'bg-green-500 text-white',
      });
      router.push('/match');
    } catch (error: any) {
      console.error('Login error', error);
      toast({
        variant: 'destructive',
        title: 'Giriş Başarısız',
        description: 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
             // New user via Google, redirect to finish profile setup
            toast({
                title: "Aramıza Hoş Geldin!",
                description: "Kaydını tamamlamak için lütfen birkaç adım daha...",
            });
            // Store google user info to pass to signup page
            const googleInfo = {
                email: user.email,
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                photoURL: user.photoURL,
            };
            sessionStorage.setItem('googleSignUpInfo', JSON.stringify(googleInfo));
            router.push('/signup?step=2&source=google');

        } else {
             // Existing user
             toast({
                title: `Tekrar Hoş Geldin, ${user.displayName?.split(' ')[0]}!`,
                className: "bg-green-500 text-white",
            });
            router.push('/match');
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


  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <AnimatedLogo className="w-24 h-24" />
            <h1 className="text-4xl font-bold font-headline">BeMatch</h1>
            <p className="text-muted-foreground">Hayatının aşkını bulmaya hazır mısın?</p>
        </div>
        <Card className="w-full bg-card/80 backdrop-blur-sm border-border/20 shadow-xl">
            <form onSubmit={handleLogin}>
                <CardHeader className="text-center">
                <CardTitle className="text-2xl">Hesabına Giriş Yap</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                 <Button variant="outline" type="button" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8 0 123.8 111.8 12.8 244 12.8c70.3 0 129.8 27.8 174.9 71.9l-63.5 61.9C325 110.8 287.1 89.6 244 89.6c-94.8 0-172.2 77.4-172.2 172.2s77.4 172.2 172.2 172.2c99.3 0 148.9-72.3 155.8-109.9H244V261.8h244z"></path></svg>}
                    Google ile Devam Et
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                        Veya e-posta ile devam et
                        </span>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="ornek@mail.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                         <Label htmlFor="password">Şifre</Label>
                         <Link href="#" className="text-sm text-muted-foreground hover:underline">
                            Şifremi Unuttum?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading || isGoogleLoading}
                        />
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || isGoogleLoading}
                        >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="sr-only">{showPassword ? "Şifreyi gizle" : "Şifreyi göster"}</span>
                        </Button>
                    </div>
                </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading || isGoogleLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Giriş Yap
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                    Hesabın yok mu?{' '}
                    <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Kayıt Ol
                    </Link>
                </p>
                </CardFooter>
            </form>
        </Card>
    </div>
  );
}
