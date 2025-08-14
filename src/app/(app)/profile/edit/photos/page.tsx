
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, ShieldCheck, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

const gallery = [
    { id: 1, url: 'https://placehold.co/400x400.png', aiHint: 'woman yoga beach', isAvatar: true },
    { id: 2, url: 'https://placehold.co/400x400.png', aiHint: 'woman reading cafe', isAvatar: false },
    { id: 3, url: 'https://placehold.co/400x400.png', aiHint: 'cityscape istanbul', isAvatar: false },
    { id: 4, url: 'https://placehold.co/400x400.png', aiHint: 'movie theater empty', isAvatar: false },
    { id: 5, url: 'https://placehold.co/400x400.png', aiHint: 'coffee art', isAvatar: false },
    { id: 6, url: 'https://placehold.co/400x400.png', aiHint: 'travel map', isAvatar: false },
];


export default function ManagePhotosPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Fotoğrafları Yönet</CardTitle>
                    <CardDescription>
                        Profil ve galeri fotoğraflarınızı ekleyin veya kaldırın.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {gallery.map(photo => (
                            <div key={photo.id} className="relative group aspect-square">
                                <Image 
                                    src={photo.url} 
                                    alt={`Photo ${photo.id}`} 
                                    fill 
                                    className="object-cover rounded-md"
                                    data-ai-hint={photo.aiHint}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                                   <div className="absolute top-1 right-1">
                                     <Button variant="destructive" size="icon" className="h-8 w-8">
                                         <Trash2 className="h-4 w-4" />
                                     </Button>
                                   </div>
                                    <div className="absolute bottom-1 left-1 w-full p-1">
                                        <Button variant="secondary" size="sm" className="w-full text-xs h-8">
                                            <Heart className="w-4 h-4 mr-1"/> Profil Resmi Yap
                                        </Button>
                                    </div>
                                </div>
                                {photo.isAvatar && (
                                     <Badge className="absolute top-2 left-2" variant="default">
                                         <ShieldCheck className="w-3 h-3 mr-1"/> Profil
                                     </Badge>
                                )}
                            </div>
                        ))}
                         <div
                            className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent text-muted-foreground"
                            onClick={() => fileInputRef.current?.click()}
                            >
                            <UploadCloud className="w-10 h-10" />
                            <p className="mt-2 text-sm font-semibold text-center">Yeni Fotoğraf Yükle</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
