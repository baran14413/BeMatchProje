
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Loader2,
  Wand2,
  Check,
  Image as ImageIcon,
  Type,
} from 'lucide-react';
import { stylizeImage } from '@/ai/flows/stylize-image-flow';
import { moderateImage } from '@/ai/flows/moderate-image-flow';
import { cn } from '@/lib/utils';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';


// Step 1: Choose post type
const Step1ChooseType = ({ onSelectType }: { onSelectType: (type: 'photo' | 'text') => void }) => (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Yeni Gönderi Oluştur</CardTitle>
        <CardDescription>
          Ne tür bir gönderi paylaşmak istersin?
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" className="h-32 flex flex-col gap-2" onClick={() => onSelectType('photo')}>
            <ImageIcon className="w-8 h-8" />
            <span className="text-lg">Fotoğraf Paylaş</span>
        </Button>
        <Button variant="outline" className="h-32 flex flex-col gap-2" onClick={() => onSelectType('text')}>
            <Type className="w-8 h-8" />
            <span className="text-lg">Yazı Yaz</span>
        </Button>
      </CardContent>
    </Card>
);

// Step 2 (Photo): Upload
const Step2PhotoUpload = ({ onFileSelect }: { onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Adım 2: Fotoğraf Yükle</CardTitle>
        <CardDescription>
          Paylaşmak istediğin fotoğrafı seç.
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
            onChange={onFileSelect}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Step 3 (Photo): Stylize & Share
const Step3PhotoShare = ({
  imgSrc,
  stylePrompt,
  setStylePrompt,
  caption,
  setCaption,
  isProcessing,
  handleApplyStyle,
  handleShare,
  onBack,
}: {
  imgSrc: string;
  stylePrompt: string;
  setStylePrompt: (value: string) => void;
  caption: string;
  setCaption: (value: string) => void;
  isProcessing: boolean;
  handleApplyStyle: () => void;
  handleShare: () => void;
  onBack: () => void;
}) => (
  <Card className="w-full max-w-lg">
    <CardHeader>
      <CardTitle>Adım 3: Düzenle ve Paylaş</CardTitle>
      <CardDescription>
        İsteğe bağlı olarak stil ve açıklama ekleyebilirsiniz.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col items-center gap-4">
      {imgSrc && (
        <Image
          alt="Preview"
          src={imgSrc}
          width={500}
          height={500}
          className="max-h-[40vh] object-contain rounded-md"
        />
      )}
      <div className="w-full space-y-2">
        <Textarea
          placeholder="İsteğe bağlı açıklama..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="min-h-[80px]"
        />
      </div>
       <div className="w-full space-y-2">
        <Textarea
          placeholder="Yapay zeka stili ekle (Örn: bir Van Gogh tablosu gibi yap...)"
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          disabled={isProcessing}
          className="min-h-[80px]"
        />
        <Button
          onClick={handleApplyStyle}
          disabled={isProcessing || !stylePrompt}
          className="w-full"
          variant="outline"
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
      <Button variant="outline" onClick={onBack}>
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

// Step 2 (Text): Write and Share
const Step2TextWrite = ({
    textContent,
    setTextContent,
    isProcessing,
    handleShare,
    onBack,
}: {
    textContent: string;
    setTextContent: (value: string) => void;
    isProcessing: boolean;
    handleShare: () => void;
    onBack: () => void;
}) => (
    <Card className="w-full max-w-lg">
        <CardHeader>
            <CardTitle>Aklındakileri Paylaş</CardTitle>
            <CardDescription>
                Düşüncelerini takipçilerinle paylaş.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Textarea
                placeholder="Neler oluyor?"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[150px] text-lg"
                autoFocus
            />
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Geri
            </Button>
            <Button onClick={handleShare} disabled={isProcessing || !textContent}>
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


export default function CreatePostPage() {
  const [step, setStep] = useState(1);
  const [postType, setPostType] = useState<'photo' | 'text' | null>(null);
  
  // Photo post states
  const [imgSrc, setImgSrc] = useState('');
  const [originalImgSrc, setOriginalImgSrc] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [caption, setCaption] = useState('');
  
  // Text post states
  const [textContent, setTextContent] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  const handleSelectType = (type: 'photo' | 'text') => {
      setPostType(type);
      setStep(2);
  }

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (reader.result) {
          const resultStr = reader.result.toString();
          setImgSrc(resultStr);
          setOriginalImgSrc(resultStr);
          setStep(3);
        }
      });
      reader.readAsDataURL(e.target.files[0]);
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
        photoDataUri: originalImgSrc, // Always stylize from original
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
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Gönderi paylaşmak için giriş yapmalısınız.' });
        return;
    }
    
    // Disable button and navigate away immediately
    setIsProcessing(true);
    router.push('/explore');
    toast({
        title: 'Paylaşılıyor...',
        description: 'Gönderiniz arka planda paylaşılıyor.',
    });

    try {
        let postData: any = {
            authorId: currentUser.uid,
            authorName: currentUser.displayName,
            authorAvatarUrl: currentUser.photoURL,
            createdAt: serverTimestamp(),
            likes: 0,
            commentsCount: 0,
            type: postType,
        };

        if (postType === 'photo') {
            const moderationResult = await moderateImage({ photoDataUri: imgSrc });
            if (!moderationResult.isSafe) {
                toast({ variant: 'destructive', title: 'Uygunsuz İçerik', description: `Yapay zeka bu görseli onaylamadı: ${moderationResult.reason}`, duration: 5000 });
                // We don't set isProcessing to false as the user has already navigated away
                return;
            }
            
            const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}`);
            const uploadTask = await uploadString(storageRef, imgSrc, 'data_url');
            const downloadURL = await getDownloadURL(uploadTask.ref);

            postData = { ...postData, url: downloadURL, caption: caption || '' };

        } else if (postType === 'text') {
            if (!textContent.trim()) {
                 toast({ variant: 'destructive', title: 'Metin Gerekli', description: 'Lütfen bir şeyler yazın.' });
                 return;
            }
            postData = { ...postData, textContent: textContent.trim() };
        }

        await addDoc(collection(db, 'posts'), postData);

        toast({
            title: 'Paylaşıldı!',
            description: 'Gönderiniz başarıyla paylaşıldı.',
            className: 'bg-green-500 text-white',
        });
        
    } catch (error) {
        console.error("Error sharing post: ", error);
        toast({ variant: 'destructive', title: 'Paylaşım Hatası', description: 'Gönderi paylaşılırken bir hata oluştu.' });
    } 
    // No finally block to reset isProcessing, as the component unmounts.
};

  
  const goBackToTypeSelect = () => {
      setPostType(null);
      setStep(1);
      // Reset states
      setImgSrc('');
      setOriginalImgSrc('');
      setStylePrompt('');
      setCaption('');
      setTextContent('');
  }

  const renderStep = () => {
    if (!postType) {
        return <Step1ChooseType onSelectType={handleSelectType} />;
    }

    if (postType === 'photo') {
        switch (step) {
          case 2:
            return <Step2PhotoUpload onFileSelect={onSelectFile} />;
          case 3:
            return (
              <Step3PhotoShare
                imgSrc={imgSrc}
                stylePrompt={stylePrompt}
                setStylePrompt={setStylePrompt}
                caption={caption}
                setCaption={setCaption}
                isProcessing={isProcessing}
                handleApplyStyle={handleApplyStyle}
                handleShare={handleShare}
                onBack={() => setStep(2)}
              />
            );
          default:
            return <Step1ChooseType onSelectType={handleSelectType} />;
        }
    }
    
    if (postType === 'text') {
        switch (step) {
            case 2:
                return (
                    <Step2TextWrite 
                        textContent={textContent}
                        setTextContent={setTextContent}
                        isProcessing={isProcessing}
                        handleShare={handleShare}
                        onBack={goBackToTypeSelect}
                    />
                );
             default:
                return <Step1ChooseType onSelectType={handleSelectType} />;
        }
    }

    return <Step1ChooseType onSelectType={handleSelectType} />;
  };

  return (
    <div className="container mx-auto max-w-lg p-4 flex items-center justify-center min-h-[80vh]">
      {renderStep()}
    </div>
  );
}
