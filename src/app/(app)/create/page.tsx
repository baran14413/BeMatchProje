
'use client';

import { useState, useRef, ChangeEvent, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  Loader2,
  Wand2,
  Check,
  Gem,
} from 'lucide-react';
import { stylizeImage } from '@/ai/flows/stylize-image-flow';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';

// Step for Photo: Stylize & Share
const PhotoShareStep = ({
  imgSrc,
  stylePrompt,
  setStylePrompt,
  caption,
  setCaption,
  isProcessing,
  handleApplyStyle,
  handleShare,
  isPremium,
}: {
  imgSrc: string;
  stylePrompt: string;
  setStylePrompt: (value: string) => void;
  caption: string;
  setCaption: (value: string) => void;
  isProcessing: boolean;
  handleApplyStyle: () => void;
  handleShare: () => void;
  isPremium: boolean;
}) => (
  <Card className="w-full max-w-lg">
    <CardHeader>
      <CardTitle>Düzenle ve Paylaş</CardTitle>
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
          disabled={isProcessing || !isPremium}
          className="min-h-[80px]"
        />
        {isPremium ? (
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
        ) : (
             <Link href="/premium" className="w-full">
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" variant="default">
                    <Gem className="mr-2 h-4 w-4" />
                    AI Düzenleme için Premium'a Yükselt
                </Button>
             </Link>
        )}
       
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
       <Link href="/explore">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" /> İptal
          </Button>
       </Link>
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

// Step for Text: Write and Share
const TextWriteStep = ({
    textContent,
    setTextContent,
    isProcessing,
    handleShare,
}: {
    textContent: string;
    setTextContent: (value: string) => void;
    isProcessing: boolean;
    handleShare: () => void;
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
             <Link href="/explore">
                <Button variant="outline">
                    <ChevronLeft className="mr-2 h-4 w-4" /> İptal
                </Button>
            </Link>
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

function CreatePostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  const postType = searchParams.get('type') || 'text';
  
  // Photo post states
  const [imgSrc, setImgSrc] = useState('');
  const [originalImgSrc, setOriginalImgSrc] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [caption, setCaption] = useState('');
  const [isStylized, setIsStylized] = useState(false);
  
  // Text post states
  const [textContent, setTextContent] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().isPremium) {
                setIsPremium(true);
            }
        }
    };
    checkPremiumStatus();
  }, [currentUser]);

  useEffect(() => {
      if (postType === 'photo') {
        const dataUriEncoded = searchParams.get('data');
        if (dataUriEncoded) {
            try {
                const dataUri = decodeURIComponent(dataUriEncoded);
                setImgSrc(dataUri);
                setOriginalImgSrc(dataUri);
            } catch (error) {
                console.error("Error decoding data URI:", error);
                toast({
                    title: 'Fotoğraf verisi bozuk',
                    description: 'Lütfen tekrar deneyin.',
                    variant: 'destructive',
                });
                router.push('/explore');
            }
        } else {
             toast({
                title: 'Fotoğraf bulunamadı',
                description: 'Lütfen tekrar deneyin.',
                variant: 'destructive',
             });
             router.push('/explore');
        }
      }
      setLoading(false);
  }, [postType, router, toast, searchParams]);

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
      setIsStylized(true);
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
    
    setIsProcessing(true);
    
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
            const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}`);
            const uploadTask = await uploadString(storageRef, imgSrc, 'data_url');
            const downloadURL = await getDownloadURL(uploadTask.ref);

            postData = { 
              ...postData, 
              url: downloadURL, 
              caption: caption || '',
              isAiEdited: isStylized,
            };

        } else if (postType === 'text') {
            if (!textContent.trim()) {
                 toast({ variant: 'destructive', title: 'Metin Gerekli', description: 'Lütfen bir şeyler yazın.' });
                 setIsProcessing(false);
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

        router.push('/explore');
        
    } catch (error) {
        console.error("Error sharing post: ", error);
        toast({ variant: 'destructive', title: 'Paylaşım Hatası', description: 'Gönderi paylaşılırken bir hata oluştu.' });
        setIsProcessing(false);
    }
  };

  const renderContent = () => {
     if (loading) {
      return <Card className="w-full max-w-lg"><CardContent className="p-6"><Skeleton className="w-full h-96" /></CardContent></Card>;
    }
    
    if (postType === 'photo') {
      return (
        <PhotoShareStep
          imgSrc={imgSrc}
          stylePrompt={stylePrompt}
          setStylePrompt={setStylePrompt}
          caption={caption}
          setCaption={setCaption}
          isProcessing={isProcessing}
          handleApplyStyle={handleApplyStyle}
          handleShare={handleShare}
          isPremium={isPremium}
        />
      );
    }
    
    if (postType === 'text') {
      return (
        <TextWriteStep
            textContent={textContent}
            setTextContent={setTextContent}
            isProcessing={isProcessing}
            handleShare={handleShare}
        />
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto max-w-lg p-4 flex items-center justify-center min-h-[80vh]">
      {renderContent()}
    </div>
  );
}


export default function CreatePostPage() {
    return (
        <Suspense fallback={<Card className="w-full max-w-lg"><CardContent className="p-6"><Skeleton className="w-full h-96" /></CardContent></Card>}>
            <CreatePostPageContent />
        </Suspense>
    )
}
