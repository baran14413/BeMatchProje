
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const HOBBIES = [
  'Müzik', 'Spor', 'Seyahat', 'Kitap Okumak', 'Film/Dizi',
  'Yemek Yapmak', 'Oyun', 'Doğa Yürüyüşü', 'Sanat', 'Teknoloji'
];

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
    age: 28,
    gender: 'female',
    interests: ['Sinema', 'Yoga', 'Seyahat', 'Müzik', 'Kitaplar'],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kişisel Bilgiler</CardTitle>
        <CardDescription>
          Ad, yaş, bio gibi temel bilgilerinizi güncelleyin.
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
                <Label htmlFor="age">Yaş</Label>
                <Input id="age" type="number" defaultValue={user.age} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="gender">Cinsiyet</Label>
                <Select defaultValue={user.gender}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="female">Kadın</SelectItem>
                        <SelectItem value="male">Erkek</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="space-y-2">
             <Label>İlgi Alanları</Label>
             <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                {HOBBIES.map((hobby) => (
                    <Badge 
                        key={hobby} 
                        variant={user.interests.includes(hobby) ? 'default' : 'secondary'} 
                        className="cursor-pointer"
                    >
                        {hobby}
                    </Badge>
                ))}
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
