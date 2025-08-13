'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Loader2,
  Wand2,
  Crop as CropIcon,
  Check,
  Ban,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stylizeImage } from '@/ai/flows/stylize-image-flow';
import { moderateImage } from '@/ai/flows/moderate-image-flow';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('2D context not available'));
  }

  const pixelRatio = window.devicePixelRatio;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    resolve(canvas.toDataURL('image/jpeg', 0.9));
  });
}


export default function CreatePostPage() {
  const [step, setStep] = useState(1);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(1 / 1);
  const [stylePrompt, setStylePrompt] = useState('');
  const [caption, setCaption] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(e.target.files[0]);
      setStep(2);
    }
  };

  const handleApplyCropAndContinue = async () => {
    if (!completedCrop || !imgRef.current) {
        toast({
            variant: 'destructive',
            title: 'Kırpma Hatası',
            description: 'Lütfen önce bir alan seçin ve kırpma işleminin tamamlanmasını bekleyin.',
        });
        return;
    }
    try {
        const croppedDataUrl = await getCroppedImg(imgRef.current, completedCrop);
        setImgSrc(croppedDataUrl);
        toast({
            title: 'Başarılı',
            description: 'Fotoğraf başarıyla kırpıldı.',
            className: 'bg-green-500 text-white',
        });
        setStep(3); // Move to the next step
    } catch (e) {
        console.error(e);
        toast({
            variant: 'destructive',
            title: 'Kırpma Hatası',
            description: 'Fotoğraf kırpılırken bir hata oluştu.',
        });
    }
  };

  const handleApplyStyle = async () => {
    if (!stylePrompt) {
      toast({
        variant: 'destructive',
        title: 'Stil Metni Gerekli',
        description: 'Lütfen bir stil metni girin.',
      });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await stylizeImage({
        photoDataUri: imgSrc,
        prompt: stylePrompt,
      });
      if (result.error || !result.stylizedImageDataUri) {
        throw new Error(result.error || 'Stil uygulanamadı.');
      }
      setImgSrc(result.stylizedImageDataUri);
      toast({
        title: 'Stil Uygulandı!',
        description: 'Yapay zeka harikalar yarattı.',
        className: 'bg-green-500 text-white',
      });
    } catch (e: any) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Stil Hatası',
        description: e.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
     if (!caption) {
      toast({
        variant: 'destructive',
        title: 'Açıklama Gerekli',
        description: 'Lütfen gönderiniz için bir açıklama yazın.',
      });
      return;
    }
    setIsProcessing(true);
    
    // Moderation check
    try {
        const moderationResult = await moderateImage({ photoDataUri: imgSrc });
        if (!moderationResult.isSafe) {
            toast({
                variant: 'destructive',
                title: 'Uygunsuz İçerik',
                description: `Yapay zeka bu görseli onaylamadı: ${moderationResult.reason}`,
                duration: 5000,
            });
            setIsProcessing(false);
            return;
        }

    } catch(e) {
        console.error("Moderation check failed", e);
        toast({
            variant: 'destructive',
            title: 'Denetleme Hatası',
            description: 'İçerik denetimi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
        });
        setIsProcessing(false);
        return;
    }
    
    toast({
        title: 'Paylaşılıyor...',
        description: 'Gönderiniz oluşturuluyor ve arkadaşlarınızla paylaşılıyor.',
    });
    
    setTimeout(() => {
        setIsProcessing(false);
        router.push('/explore');
    }, 2000);
  };
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect || 1 / 1));
  }

  const Step1 = () => (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Yeni Gönderi Oluştur</CardTitle>
        <CardDescription>
          Paylaşmak için bilgisayarınızdan bir fotoğraf seçin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="w-16 h-16 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">Fotoğraf Yükle</p>
          <p className="text-sm text-muted-foreground">
            Sürükleyip bırakın veya tıklayın
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onSelectFile}
          />
        </div>
      </CardContent>
    </Card>
  );

  const Step2 = () => (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Adım 2: Fotoğrafı Kırp</CardTitle>
        <CardDescription>
          Paylaşmak istediğiniz alanı seçin.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {imgSrc && (
          <div className='w-full flex justify-center'>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
            >
              <Image
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                width={500}
                height={500}
                onLoad={onImageLoad}
                className="max-h-[60vh] object-contain"
              />
            </ReactCrop>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Geri
        </Button>
        <Button onClick={handleApplyCropAndContinue} disabled={!completedCrop?.width}>
          Kırp ve Devam Et <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
  
  const Step3 = () => (
    <Card className="w-full max-w-lg">
        <CardHeader>
            <CardTitle>Adım 3: Yapay Zeka İle Stilizasyon</CardTitle>
            <CardDescription>
            İsterseniz fotoğrafınıza sanatsal bir dokunuş katın.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            {imgSrc && (
            <Image
                alt="Styled Preview"
                src={imgSrc}
                width={500}
                height={500}
                className="max-h-[50vh] object-contain rounded-md"
            />
            )}
            <div className="w-full space-y-2">
            <Textarea
                placeholder="Örn: bir Van Gogh tablosu gibi yap..."
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                disabled={isProcessing}
                className="min-h-[80px]"
            />
            <Button
                onClick={handleApplyStyle}
                disabled={isProcessing || !stylePrompt}
                className="w-full"
            >
                {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Wand2 className="mr-2 h-4 w-4" />
                )}
                Stil Uygula
            </Button>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Geri
            </Button>
            <Button onClick={() => setStep(4)}>
            İleri <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
      </CardFooter>
    </Card>
  );

  const Step4 = () => (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Adım 4: Açıklama Ekle ve Paylaş</CardTitle>
        <CardDescription>
          Harika fotoğrafınız için bir başlık yazın.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {imgSrc && (
          <Image
            alt="Final Preview"
            src={imgSrc}
            width={500}
            height={500}
            className="max-h-[50vh] object-contain rounded-md"
          />
        )}
        <Textarea
          placeholder="Bir şeyler yazın..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="min-h-[100px]"
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(3)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Geri
        </Button>
        <Button onClick={handleShare} disabled={isProcessing}>
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Paylaş
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto max-w-lg p-4 flex items-center justify-center min-h-[80vh]">
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
      {step === 4 && <Step4 />}
    </div>
  );
}
