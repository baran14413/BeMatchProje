
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, GitBranch, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import packageJson from '../../../../../package.json';

export default function GeminiUpdatesPage() {
    const genkitVersion = packageJson.dependencies.genkit;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-primary"/>
                    Gemini & AI Altyapısı
                </CardTitle>
                <CardDescription>
                    Bu uygulama, Google'ın en gelişmiş yapay zeka modellerini Genkit çerçevesi aracılığıyla kullanır.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <GitBranch className="w-7 h-7 text-primary" />
                        <div>
                            <p className="font-semibold">Mevcut Genkit Sürümü</p>
                            <p className="text-sm text-muted-foreground">Yapay zeka akışlarını yöneten çerçevenin versiyonu.</p>
                        </div>
                    </div>
                     <Badge variant="outline" className="text-base font-mono py-1 px-3">
                        v{genkitVersion || 'Bilinmiyor'}
                    </Badge>
                </div>
                 <div className="p-4 rounded-lg bg-muted/50">
                     <div className="flex items-center gap-3 mb-2">
                        <Terminal className="w-7 h-7 text-primary" />
                        <div>
                            <p className="font-semibold">AI Akışları (Flows)</p>
                             <p className="text-sm text-muted-foreground">Arka planda çalışan mevcut yapay zeka görevleri.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Badge variant="secondary">moderateImageFlow</Badge>
                        <Badge variant="secondary">stylizeImageFlow</Badge>
                        <Badge variant="secondary">translateTextFlow</Badge>
                        <Badge variant="secondary">deleteUserDataFlow</Badge>
                        <Badge variant="secondary">logSuspiciousActivityFlow</Badge>
                        <Badge variant="secondary">getSystemInfoFlow</Badge>
                        <Badge variant="secondary">logActivityFlow</Badge>
                    </div>
                </div>
                <div className="text-sm text-muted-foreground pt-4 border-t">
                    <p>
                        Gelecekteki yapay zeka güncellemeleri, yeni model entegrasyonları (örn: görüntü oluşturma, ses analizi) ve yetenekler bu panel üzerinden duyurulacak ve yönetilecektir.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
