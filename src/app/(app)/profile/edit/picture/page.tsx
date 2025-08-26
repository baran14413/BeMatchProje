'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Loader2, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth, db, storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

export default function EditProfilePicturePage() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isNewPhotoSelected, setIsNewPhotoSelected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const currentUser = auth.currentUser;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (currentUser?.photoURL) {
      setImgSrc(currentUser.photoURL);
    }
  }, [currentUser]);


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImgSrc(event.target?.result as string);
        setIsNewPhotoSelected(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !imgSrc || !isNewPhotoSelected) {
        toast({
            variant: 'destructive',
            title: 'Yeni Fotoğraf Seçilmedi',
            description: 'Lütfen kaydetmek için yeni bir fotoğraf seçin.',
        });
        return;
    };

    setIsSaving(true);
    toast({
      title: 'Kaydediliyor...',
      description: 'Yeni profil fotoğrafınız kaydediliyor.',
    });
    
    try {
        const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
        await uploadString(storageRef, imgSrc, 'data_url');
        const photoURL = await getDownloadURL(storageRef);

        await updateProfile(currentUser, { photoURL });
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { avatarUrl: photoURL });

        setIsSaving(false);
        setIsNewPhotoSelected(false);
        toast({
            title: 'Başarılı!',
            description: 'Profil fotoğrafınız başarıyla güncellendi.',
            className: 'bg-green-500 text-white',
        });
    } catch(error) {
         console.error("Error saving profile picture:", error);
         toast({ variant: 'destructive', title: 'Kaydedilemedi', description: 'Fotoğraf kaydedilirken bir hata oluştu.' });
         setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Fotoğrafını Değiştir</CardTitle>
        <CardDescription>
          Yeni bir profil fotoğrafı yükleyin. Unutmayın, yüklediğiniz içeriklerden siz sorumlusunuz.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div
          className={cn(
            "relative w-48 h-48 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-dashed cursor-pointer border-primary/50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
          />
          {imgSrc ? (
            <Image src={imgSrc} alt="Profil fotoğrafı önizlemesi" layout="fill" objectFit="cover" />
          ) : (
            <div className="text-center text-muted-foreground p-4 flex flex-col items-center">
              <Upload className="w-12 h-12 mb-2" />
              <p className="text-sm">Fotoğraf Seç</p>
            </div>
          )}
        </div>
        
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Topluluk Kuralları</AlertTitle>
            <AlertDescription>
              Yüklediğiniz fotoğrafın çıplaklık, argo, küfür, şiddet veya nefret söylemi içermediğinden emin olun. Kurallara uymayan içerikler hesabınızın askıya alınmasına neden olabilir.
            </AlertDescription>
        </Alert>

      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={!isNewPhotoSelected || isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Kaydet
        </Button>
      </CardFooter>
    </Card>
  );
}
