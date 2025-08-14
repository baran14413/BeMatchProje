
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function PersonalInfoPage() {
  const { toast } = useToast();
  
  // Mock data - in a real app this would come from an API
  const user = {
    name: 'Elif',
    username: 'elif.s',
    bio: 'Hayatı dolu dolu yaşamayı seven, enerjik biriyim. İstanbul\'da yeni yerler keşfetmek, yoga yapmak ve sinemaya gitmek en büyük tutkularım. Pozitif biriyim.',
    country: 'Türkiye',
    city: 'İstanbul',
  };

  const [bio, setBio] = useState(user.bio);
  const bioMaxLength = 150;


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: 'Bilgiler Güncellendi',
      description: 'Kişisel bilgileriniz başarıyla kaydedildi.',
      className: 'bg-green-500 text-white',
    });
  };
  
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= bioMaxLength) {
      setBio(e.target.value);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Kişisel Bilgiler</CardTitle>
        <CardDescription>
          Temel profil bilgilerinizi güncelleyin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Ad</Label>
            <Input id="name" defaultValue={user.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input id="username" defaultValue={user.username} />
          </div>
          <div className="space-y-2">
             <div className="flex justify-between items-baseline">
                <Label htmlFor="bio">Hakkımda</Label>
                <span className="text-xs text-muted-foreground">
                    {bio.length} / {bioMaxLength}
                </span>
            </div>
            <Textarea 
                id="bio" 
                value={bio} 
                onChange={handleBioChange}
                maxLength={bioMaxLength}
                className="min-h-[120px]" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="country">Ülke</Label>
                <Input id="country" defaultValue={user.country} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="city">Şehir</Label>
                <Input id="city" defaultValue={user.city} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Değişiklikleri Kaydet</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
