'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
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
  RectangleHorizontal,
  RectangleVertical,
  Square,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stylizeImage } from '@/ai/flows/stylize-image-flow';
import { moderateImage } from '@/ai/flows/moderate-image-flow';
import { cn } from '@/lib/utils';


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

// This is a replacement for getCroppedImg to fix the cropping issue.
function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop
) {
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const pixelRatio = window.devicePixelRatio
  
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio)

  ctx.scale(pixelRatio, pixelRatio)
  ctx.imageSmoothingQuality = 'high'

  const cropX = crop.x * scaleX
  const cropY = crop.y * scaleY

  const centerX = image.naturalWidth / 2
  const centerY = image.naturalHeight / 2

  ctx.save()

  // 5) Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY)
  // 4) Move the origin to the center of the original position
  ctx.translate(centerX, centerY)
  // 2) Scale the image
  // 1) Move the center of the image to the origin (0,0)
  ctx.translate(-centerX, -centerY)
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  )

  ctx.restore()
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
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
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

  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
    }
  }, [completedCrop]);


  const handleApplyCropAndContinue = async () => {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      toast({
        variant: 'destructive',
        title: 'Kırpma Hatası',
        description: 'Lütfen önce bir alan seçin ve kırpma işleminin tamamlanmasını bekleyin.',
      });
      return;
    }

    const dataUrl = previewCanvas.toDataURL('image/jpeg', 0.9);
    setImgSrc(dataUrl);

    toast({
        title: 'Başarılı',
        description: 'Fotoğraf başarıyla kırpıldı.',
        className: 'bg-green-500 text-white',
    });
    setStep(3); // Move to the next step
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
    if (aspect) {
      const { width, height } = e.currentTarget;
      const newCrop = centerAspectCrop(width, height, aspect);
      setCrop(newCrop);
      setCompletedCrop(newCrop);
    }
  }

  const Step1 = () => (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Yeni Gönderi Oluştur</CardTitle>
        <CardDescription>
          Bugünün anısını paylaşarak arkadaşlarını etkile.
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
          Paylaşmak istediğiniz alanı seçin ve en boy oranını ayarlayın.
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
              className="max-h-[50vh]"
            >
              <Image
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                width={500}
                height={500}
                onLoad={onImageLoad}
                className="object-contain"
              />
            </ReactCrop>
          </div>
        )}
        <div className="w-full flex justify-center gap-2">
            <Button variant={aspect === 1 / 1 ? 'default' : 'outline'} size="icon" onClick={() => setAspect(1/1)}><Square /></Button>
            <Button variant={aspect === 4 / 5 ? 'default' : 'outline'} size="icon" onClick={() => setAspect(4/5)}><RectangleVertical /></Button>
            <Button variant={aspect === 16 / 9 ? 'default' : 'outline'} size="icon" onClick={() => setAspect(16/9)}><RectangleHorizontal /></Button>
            <Button variant={aspect === undefined ? 'default' : 'outline'} size="icon" onClick={() => setAspect(undefined)}><CropIcon /></Button>
        </div>
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
      {/* Hidden canvas for preview */}
      <canvas
        ref={previewCanvasRef}
        style={{
          display: 'none',
          objectFit: 'contain',
          width: completedCrop?.width,
          height: completedCrop?.height,
        }}
      />
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
      {step === 4 && <Step4 />}
    </div>
  );
}
