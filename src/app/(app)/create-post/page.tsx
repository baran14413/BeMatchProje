
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Image as ImageIcon, FileText, Loader2, Upload, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const MAX_TEXT_LENGTH = 500;

export default function CreatePostPage() {
    const router = useRouter();
    const { toast } = useToast();
    const currentUser = auth.currentUser;

    const [activeTab, setActiveTab] = useState('text');
    const [textContent, setTextContent] = useState('');
    const [caption, setCaption] = useState('');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const extractHashtags = (text: string): string[] => {
        const hashtagRegex = /#(\w+)/g;
        const matches = text.match(hashtagRegex);
        if (!matches) return [];
        return matches.map(match => match.substring(1));
    }

    const handleSubmit = async () => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Giriş yapmalısınız.' });
            return;
        }

        setIsSubmitting(true);
        try {
            let postData: any = {
                authorId: currentUser.uid,
                createdAt: serverTimestamp(),
                likes: 0,
                commentsCount: 0,
            };

            if (activeTab === 'text') {
                if (!textContent.trim()) {
                    toast({ variant: 'destructive', title: 'Metin boş olamaz.' });
                    setIsSubmitting(false);
                    return;
                }
                postData.type = 'text';
                postData.textContent = textContent;
                postData.hashtags = extractHashtags(textContent);
            } else if (activeTab === 'photo') {
                if (!imageSrc) {
                    toast({ variant: 'destructive', title: 'Lütfen bir fotoğraf seçin.' });
                    setIsSubmitting(false);
                    return;
                }
                const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}`);
                await uploadString(storageRef, imageSrc, 'data_url');
                const downloadURL = await getDownloadURL(storageRef);

                postData.type = 'photo';
                postData.url = downloadURL;
                postData.caption = caption;
                postData.hashtags = extractHashtags(caption);
            }

            await addDoc(collection(db, 'posts'), postData);

            toast({ title: 'Gönderi paylaşıldı!', className: 'bg-green-500 text-white' });
            router.push(`/profile/${currentUser.displayName || currentUser.uid}`);

        } catch (error) {
            console.error("Error creating post:", error);
            toast({ variant: 'destructive', title: 'Gönderi oluşturulurken bir hata oluştu.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isSubmitDisabled = isSubmitting || (activeTab === 'text' && !textContent.trim()) || (activeTab === 'photo' && !imageSrc);

    return (
        <div className="flex h-screen flex-col">
            <header className="flex items-center p-4 border-b">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-bold mx-auto">Yeni Gönderi</h1>
                <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Paylaş
                </Button>
            </header>
            
            <main className="flex-1 overflow-y-auto bg-muted/20 p-4">
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Metin</TabsTrigger>
                        <TabsTrigger value="photo"><ImageIcon className="mr-2 h-4 w-4" />Galeri</TabsTrigger>
                    </TabsList>
                    <TabsContent value="text" className="mt-4">
                        <Card>
                             <CardContent className="p-4">
                                <Textarea
                                    placeholder="Aklından geçenleri yaz..."
                                    className="min-h-[200px] border-none focus-visible:ring-0 text-base"
                                    value={textContent}
                                    maxLength={MAX_TEXT_LENGTH}
                                    onChange={(e) => setTextContent(e.target.value)}
                                />
                             </CardContent>
                             <CardFooter>
                                <p className="text-xs text-muted-foreground w-full text-right">
                                    {textContent.length} / {MAX_TEXT_LENGTH}
                                </p>
                             </CardFooter>
                        </Card>
                    </TabsContent>
                    <TabsContent value="photo" className="mt-4">
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <div 
                                    className="aspect-square w-full rounded-lg border-2 border-dashed bg-muted flex items-center justify-center cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                    {imageSrc ? (
                                        <div className="relative w-full h-full">
                                            <Image src={imageSrc} alt="Önizleme" layout="fill" className="object-contain rounded-lg" />
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            <Upload className="mx-auto h-12 w-12" />
                                            <p>Fotoğraf Yükle</p>
                                        </div>
                                    )}
                                </div>
                                 <Textarea
                                    placeholder="Bir açıklama yaz..."
                                    value={caption}
                                     maxLength={MAX_TEXT_LENGTH}
                                    onChange={(e) => setCaption(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground w-full text-right">
                                    {caption.length} / {MAX_TEXT_LENGTH}
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                <Alert variant="default" className="mt-4 border-yellow-500/50">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertTitle>Topluluk Kuralları</AlertTitle>
                    <AlertDescription>
                        Yüklediğiniz içeriğin çıplaklık, şiddet veya nefret söylemi içermediğinden emin olun. Kurallara uymayan paylaşımlar hesabınızın askıya alınmasına neden olabilir.
                    </AlertDescription>
                </Alert>
            </main>
        </div>
    );
}
