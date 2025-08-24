
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Trash, PauseCircle, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteUserData } from '@/ai/flows/delete-user-data-flow';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

const reasons = [
  { id: 'found_someone', label: 'Birini buldum.' },
  { id: 'taking_a_break', label: 'Sadece ara vermek istiyorum.' },
  { id: 'dislike_app', label: 'Uygulamayı veya özelliklerini beğenmedim.' },
  { id: 'not_enough_matches', label: 'Yeterince eşleşme bulamadım.' },
  { id: 'privacy_concerns', label: 'Gizlilikle ilgili endişelerim var.' },
  { id: 'other', label: 'Başka bir sebep.' },
];

export default function DeleteAccountPage() {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = auth.currentUser;

  const handleDeleteAccount = async () => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' });
        return;
    }
    setIsDeleting(true);
    try {
        const result = await deleteUserData({ userId: currentUser.uid });
        if (result.success) {
            toast({
                title: 'Hesabınız Silindi',
                description: 'Tüm verileriniz başarıyla silindi. Yönlendiriliyorsunuz...',
            });
            await signOut(auth);
            router.push('/login');
        } else {
            throw new Error(result.error || 'Bilinmeyen bir hata oluştu.');
        }
    } catch (error: any) {
        console.error("Error deleting account:", error);
        toast({ variant: 'destructive', title: 'Hesap Silinemedi', description: error.message });
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Aramızdan ayrılmana gerçekten üzüldük.</CardTitle>
        <CardDescription>
          Deneyimini iyileştirmemize yardımcı olmak için neden ayrıldığını bizimle paylaşır mısın?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedReason}
          onValueChange={setSelectedReason}
          className="space-y-2"
        >
          {reasons.map((reason) => (
            <div key={reason.id} className="flex items-center space-x-2">
              <RadioGroupItem value={reason.id} id={reason.id} />
              <Label htmlFor={reason.id} className="font-normal">
                {reason.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {selectedReason === 'other' && (
          <div className="pl-6 space-y-2">
            <Label htmlFor="other_reason_text">Lütfen belirtin:</Label>
            <Textarea
              id="other_reason_text"
              placeholder="Geri bildiriminiz bizim için değerlidir..."
              value={otherReasonText}
              onChange={(e) => setOtherReasonText(e.target.value)}
            />
          </div>
        )}

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Uyarı: Bu işlem geri alınamaz!</AlertTitle>
          <AlertDescription>
            Hesabınızı sildiğinizde, tüm eşleşmeleriniz, sohbetleriniz, gönderileriniz ve diğer verileriniz kalıcı olarak kaldırılacaktır.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="outline" disabled>
          <PauseCircle className="mr-2 h-4 w-4" />
          Hesabımı Askıya Al (Yakında)
        </Button>
         <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                    Hesabımı Kalıcı Olarak Sil
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                       Bu son adımdır. Bu işlem kesinlikle geri alınamaz. Devam etmek istediğinizden emin misiniz?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDeleteAccount} 
                        className={cn(buttonVariants({variant: "destructive"}))}
                        disabled={isDeleting}
                    >
                         {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Evet, Hesabımı Sil
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
