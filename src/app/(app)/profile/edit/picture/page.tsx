
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
import { Upload, Loader2, ShieldCheck, Ban, Check } from 'lucide-react';
import { moderateImage, ModerateImageOutput } from '@/ai/flows/moderate-image-flow';
import { cn } from '@/lib/utils';
import { auth, db, storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

type ModerationStatus = 'idle' | 'checking' | 'safe' | 'unsafe';

export default function EditProfilePicturePage() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>('idle');
  const [moderationResult, setModerationResult] = useState<ModerateImageOutput | null>(null);
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
      setModerationStatus('idle');
      setModerationResult(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImgSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModerateImage = async () => {
    if (!imgSrc || imgSrc.startsWith('https://')) {
        toast({ title: 'Lütfen önce yeni bir fotoğraf seçin.'});
        return;
    };
    setModerationStatus('checking');
    try {
      const result = await moderateImage({ photoDataUri: imgSrc });
      setModerationResult(result);
      if (result.isSafe) {
        setModerationStatus('safe');
      } else {
        setModerationStatus('unsafe');
      }
    } catch (error) {
      console.error("Moderation failed", error);
      toast({
        variant: 'destructive',
        title: 'Denetleme Başarısız',
        description: 'Fotoğraf denetlenirken bir hata oluştu. Lütfen tekrar deneyin.'
      });
      setModerationStatus('idle');
    }
  };

  const handleSave = async () => {
    if (!currentUser || !imgSrc) return;
    setIsSaving(true);
    toast({
      title: 'Kaydediliyor...',
      description: 'Yeni profil fotoğrafınız kaydediliyor.',
    });
    
    try {
        const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
        await uploadString(storageRef, imgSrc, 'data_url');
        const photoURL = await getDownloadURL(storageRef);

        // Update Firebase Auth profile
        await updateProfile(currentUser, { photoURL });

        // Update Firestore user document
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { avatarUrl: photoURL });

        setIsSaving(false);
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
          Yeni bir profil fotoğrafı yükleyin. Yüklenen fotoğraf yapay zeka tarafından incelenecektir.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div
          className={cn(
            "relative w-48 h-48 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-dashed cursor-pointer",
            moderationStatus === 'safe' && 'border-green-500',
            moderationStatus === 'unsafe' && 'border-destructive'
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

        {imgSrc && moderationStatus !== 'checking' && moderationStatus !== 'safe' && !imgSrc.startsWith('https://') && (
          <Button onClick={handleModerateImage}>
            Fotoğrafı Denetle
          </Button>
        )}

        {moderationStatus === 'checking' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Yapay zeka tarafından denetleniyor...</span>
          </div>
        )}

        {moderationStatus === 'unsafe' && (
          <Alert variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertTitle>Uygunsuz İçerik Tespit Edildi</AlertTitle>
            <AlertDescription>
              {moderationResult?.reason || 'Lütfen kurallarımıza uygun başka bir fotoğraf yükleyin.'}
            </AlertDescription>
          </Alert>
        )}
        {moderationStatus === 'safe' && (
          <Alert className="border-green-500 text-green-700 dark:text-green-400">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <AlertTitle>Fotoğraf Uygun</AlertTitle>
            <AlertDescription>
              Bu fotoğrafı profil fotoğrafınız olarak ayarlayabilirsiniz.
            </AlertDescription>
          </Alert>
        )}

      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={moderationStatus !== 'safe' || isSaving}>
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
