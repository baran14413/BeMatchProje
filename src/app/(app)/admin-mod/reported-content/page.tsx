
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquareWarning } from 'lucide-react';


export default function ModReportedContentPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Şikayet Yönetimi</CardTitle>
                <CardDescription>Kullanıcılar tarafından şikayet edilen içerikleri inceleyin.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10 border-2 border-dashed rounded-lg">
                    <MessageSquareWarning className="w-12 h-12 mb-4" />
                    <h3 className="text-lg font-semibold">Henüz İncelenecek Şikayet Yok</h3>
                    <p className="text-sm">Bir içerik şikayet edildiğinde burada görünecektir.</p>
                </div>
            </CardContent>
        </Card>
    );
}
