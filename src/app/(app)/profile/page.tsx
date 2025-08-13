import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import ProfileImprovement from '@/components/profile-improvement';

// Mock data for the user profile
const userProfile = {
  name: 'Can Yılmaz',
  age: 29,
  avatarUrl: 'https://placehold.co/128x128.png',
  aiHint: 'man portrait',
  bio: 'Yazılım mühendisi. Boş zamanlarımda yeni teknolojileri keşfetmeyi, doğa yürüyüşleri yapmayı ve iyi bir film izlemeyi severim. Uyumlu ve eğlenceli birini arıyorum.',
  interests: ['Teknoloji', 'Yürüyüş', 'Sinema', 'Müzik', 'Yemek'],
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="flex flex-col items-center p-8">
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage src={userProfile.avatarUrl} data-ai-hint={userProfile.aiHint}/>
                <AvatarFallback className="text-4xl">
                  {userProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold font-headline">{userProfile.name}</h1>
              <p className="text-muted-foreground">{userProfile.age} yaşında</p>
              <Button variant="outline" className="mt-4">
                <Edit className="mr-2 h-4 w-4" /> Profili Düzenle
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Hakkımda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{userProfile.bio}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>İlgi Alanları</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {userProfile.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-sm">
                  {interest}
                </Badge>
              ))}
            </CardContent>
          </Card>
          
          <ProfileImprovement
            currentProfile={userProfile.bio}
            currentInterests={userProfile.interests.join(', ')}
          />

        </div>
      </div>
    </div>
  );
}
