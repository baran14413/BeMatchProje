
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bookmark } from 'lucide-react';

export default function SavedPostsPage() {
    // In a real app, you would fetch the user's saved posts from Firestore
    const savedPosts: any[] = [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kaydedilen Gönderiler</CardTitle>
                <CardDescription>
                    Daha sonra tekrar göz atmak için kaydettiğiniz gönderiler.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {savedPosts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {/* Map through saved posts here */}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10 border-2 border-dashed rounded-lg">
                        <Bookmark className="w-12 h-12 mb-4" />
                        <h3 className="text-lg font-semibold">Henüz Kaydedilmiş Gönderi Yok</h3>
                        <p className="text-sm">Bir gönderiyi kaydettiğinizde burada görünecektir.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
