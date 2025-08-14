
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserX } from 'lucide-react';

const blockedUsers = [
  { id: 1, name: 'Selin', avatar: 'https://placehold.co/40x40.png', aiHint: 'woman portrait city night' },
  { id: 2, name: 'Ahmet', avatar: 'https://placehold.co/40x40.png', aiHint: 'portrait man beach sunset' },
];

export default function BlockedAccountsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Engellenen Hesaplar</CardTitle>
                <CardDescription>
                    Engellediğiniz kişileri buradan yönetebilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {blockedUsers.length > 0 ? (
                     <div className="space-y-4">
                        {blockedUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar} data-ai-hint={user.aiHint} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{user.name}</span>
                                </div>
                                <Button variant="outline" size="sm">Engeli Kaldır</Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10 border-2 border-dashed rounded-lg">
                        <UserX className="w-12 h-12 mb-4" />
                        <h3 className="text-lg font-semibold">Engellenmiş Kullanıcı Yok</h3>
                        <p className="text-sm">Birini engellediğinizde burada görünecektir.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
