
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function SecurityPage() {
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, you would add validation here
    toast({
      title: 'Şifre Değiştirildi',
      description: 'Şifreniz başarıyla güncellendi.',
      className: 'bg-green-500 text-white',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Şifre ve Güvenlik</CardTitle>
        <CardDescription>
          Şifrenizi değiştirin ve hesap güvenliğinizi artırın.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mevcut Şifre</Label>
            <div className="relative">
                <Input id="currentPassword" type={showCurrent ? 'text' : 'password'} required />
                <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowCurrent(!showCurrent)}
                >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="newPassword">Yeni Şifre</Label>
             <div className="relative">
                <Input id="newPassword" type={showNew ? 'text' : 'password'} required />
                 <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowNew(!showNew)}
                >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
            <div className="relative">
                <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} required />
                 <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowConfirm(!showConfirm)}
                >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Şifreyi Değiştir</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
