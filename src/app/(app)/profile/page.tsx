import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Camera, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

const userProfile = {
  name: 'Can Yılmaz',
  age: 29,
  avatarUrl: 'https://placehold.co/128x128.png',
  aiHint: 'man portrait professional',
  bio: 'Yazılım mühendisi. Boş zamanlarımda yeni teknolojileri keşfetmeyi, doğa yürüyüşleri yapmayı ve iyi bir film izlemeyi severim. Uyumlu ve eğlenceli birini arıyorum.',
  interests: ['Teknoloji', 'Yürüyüş', 'Sinema', 'Müzik', 'Yemek', 'Doğa'],
  gallery: [
      { id: 1, url: 'https://placehold.co/400x600.png', aiHint: 'man hiking mountain' },
      { id: 2, url: 'https://placehold.co/400x600.png', aiHint: 'man reading book' },
      { id: 3, url: 'https://placehold.co/400x600.png', aiHint: 'man cooking kitchen' },
      { id: 4, url: 'https://placehold.co/400x600.png', aiHint: 'man with dog park' },
  ]
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-8 md:pl-24">
      <div className="flex flex-col gap-8">

        {/* Profile Header */}
        <Card className="overflow-hidden">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                 <div className="relative">
                    <Avatar className="w-36 h-36 border-4 border-background ring-4 ring-primary">
                        <AvatarImage src={userProfile.avatarUrl} data-ai-hint={userProfile.aiHint}/>
                        <AvatarFallback className="text-5xl">
                        {userProfile.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                     <Button size="icon" className="absolute bottom-2 right-2 rounded-full h-9 w-9">
                        <Camera className="w-4 h-4"/>
                     </Button>
                 </div>
                <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-3xl font-bold font-headline">{userProfile.name}, {userProfile.age}</h1>
                     <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                        <p className="text-sm font-medium text-green-600">Doğrulanmış Profil</p>
                    </div>
                    <Button variant="outline" className="mt-4 w-full sm:w-auto">
                        <Edit className="mr-2 h-4 w-4" /> Profili Düzenle
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* About Card */}
        <Card>
            <CardHeader>
                <CardTitle>Hakkımda</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-base">{userProfile.bio}</p>
            </CardContent>
        </Card>

        {/* Interests Card */}
        <Card>
            <CardHeader>
                <CardTitle>İlgi Alanları</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {userProfile.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-sm px-3 py-1 rounded-lg">
                  {interest}
                </Badge>
              ))}
            </CardContent>
        </Card>

        {/* Gallery Card */}
        <Card>
            <CardHeader>
                <CardTitle>Fotoğraflarım</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {userProfile.gallery.map(image => (
                        <div key={image.id} className="relative aspect-[3/4] rounded-lg overflow-hidden group">
                           <Image 
                                src={image.url}
                                alt={`Fotoğraf ${image.id}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                data-ai-hint={image.aiHint}
                           />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
