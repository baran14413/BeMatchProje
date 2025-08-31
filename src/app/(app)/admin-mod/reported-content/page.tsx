
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareWarning } from 'lucide-react';


export default function ModReportedContentPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Şikayet Edilen İçerikler</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10 border-2 border-dashed rounded-lg">
                    <MessageSquareWarning className="w-12 h-12 mb-4" />
                    <h3 className="text-lg font-semibold">Henüz Rapor Edilen İçerik Yok</h3>
                    <p className="text-sm">Bir içerik rapor edildiğinde burada görünecektir.</p>
                </div>
            </CardContent>
        </Card>
    );
}
