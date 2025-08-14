
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function PersonalInfoPage() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: 'Bilgiler Güncellendi',
      description: 'Kişisel bilgileriniz başarıyla kaydedildi.',
      className: 'bg-green-500 text-white',
    });
  };
  
  // Mock data - in a real app this would come from an API
  const user = {
    name: 'Elif',
    username: 'elif.s',
    bio: 'Hayatı keşfetmeyi seven, enerjik biriyim. İstanbul\'da yaşıyorum ve yeni yerler keşfetmek, yoga yapmak ve sinemaya gitmek en büyük tutkularım. Benim gibi hayat dolu, pozitif birini arıyorum.',
    country: 'Türkiye',
    city: 'İstanbul',
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
            <Label htmlFor="bio">Hakkımda</Label>
            <Textarea id="bio" defaultValue={user.bio} className="min-h-[120px]" />
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
