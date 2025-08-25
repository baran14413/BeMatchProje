
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PersonalInfoPage() {
  const { toast } = useToast();
  const currentUser = auth.currentUser;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    city: '',
  });

  const bioMaxLength = 250;

  useEffect(() => {
    const fetchUserData = async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setFormData({
                    name: userData.name || '',
                    username: userData.username || '',
                    email: userData.email || '',
                    bio: userData.bio || '',
                    city: userData.city || '',
                });
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast({ variant: 'destructive', title: "Kullanıcı verileri alınamadı." });
        } finally {
            setLoading(false);
        }
    };
    fetchUserData();
  }, [currentUser, toast]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            name: formData.name,
            username: formData.username,
            bio: formData.bio,
            city: formData.city
        });
        toast({
            title: 'Bilgiler Güncellendi',
            description: 'Kişisel bilgileriniz başarıyla kaydedildi.',
            className: 'bg-green-500 text-white',
        });
    } catch (error) {
        console.error("Error updating user data:", error);
        toast({ variant: 'destructive', title: "Bilgiler güncellenirken bir hata oluştu." });
    } finally {
        setSaving(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === 'bio' && value.length > bioMaxLength) {
        return;
    }
    setFormData(prev => ({...prev, [id]: value}));
  };

  if (loading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Kişisel Bilgiler</CardTitle>
                  <CardDescription>Temel profil bilgilerinizi güncelleyin.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                  <div className='space-y-2'>
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                   <div className='space-y-2'>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-10 w-full" />
                  </div>
              </CardContent>
          </Card>
      )
  }

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
            <Input id="name" value={formData.name} onChange={handleChange} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input id="username" value={formData.username} onChange={handleChange} disabled={saving}/>
          </div>
           <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" value={formData.email} disabled />
             <p className="text-xs text-muted-foreground">E-posta adresiniz değiştirilemez.</p>
          </div>
          <div className="space-y-2">
             <div className="flex justify-between items-baseline">
                <Label htmlFor="bio">Hakkımda</Label>
                <span className="text-xs text-muted-foreground">
                    {formData.bio.length} / {bioMaxLength}
                </span>
            </div>
            <Textarea 
                id="bio" 
                value={formData.bio} 
                onChange={handleChange}
                maxLength={bioMaxLength}
                className="min-h-[120px]" 
                disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Şehir</Label>
            <Input id="city" value={formData.city} onChange={handleChange} disabled={saving}/>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving || loading}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Değişiklikleri Kaydet
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
