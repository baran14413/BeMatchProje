import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center">
        <Heart className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-4 text-5xl font-bold tracking-tight text-primary sm:text-6xl font-headline">
          BeMatch
        </h1>
        <p className="mt-6 text-lg leading-8 text-foreground/80">
          Hayalinizdeki partneri bulmanın en modern yolu.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild size="lg">
            <Link href="/login">Giriş Yap</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Kayıt Ol</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
