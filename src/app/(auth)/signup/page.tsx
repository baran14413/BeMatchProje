'use client';

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

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = (event: React.FormEvent) => {
    event.preventDefault();
    // Mock signup logic
    router.push('/match');
  };

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSignup}>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Hesap Oluştur</CardTitle>
          <CardDescription>
            Başlamak için bilgilerinizi girin.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">Ad</Label>
            <Input id="first-name" placeholder="Can" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Soyad</Label>
            <Input id="last-name" placeholder="Yılmaz" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" placeholder="ornek@mail.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Şifre</Label>
            <Input id="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="w-full">
            Kayıt Ol
          </Button>
          <div className="mt-4 text-center text-sm">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="underline">
              Giriş Yap
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
