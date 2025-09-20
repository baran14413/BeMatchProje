
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import AnimatedLogo from '@/components/ui/animated-logo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <AnimatedLogo className="w-24 h-24" />
            <h1 className="text-4xl font-bold font-headline">BeMatch</h1>
            <p className="text-muted-foreground">Hayatının aşkını bulmaya hazır mısın?</p>
        </div>
        <Card className="w-full">
            <form onSubmit={handleLogin}>
                <CardHeader className="text-center">
                <CardTitle className="text-2xl">Hesabına Giriş Yap</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="ornek@mail.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
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
                        disabled={isLoading}
                        />
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="sr-only">{showPassword ? "Şifreyi gizle" : "Şifreyi göster"}</span>
                        </Button>
                    </div>
                </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
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
