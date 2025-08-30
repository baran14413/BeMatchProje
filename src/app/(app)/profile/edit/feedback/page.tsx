
'use client';

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitFeedback } from '@/ai/flows/submit-feedback-flow';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = auth.currentUser;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Lütfen Puan Verin',
        description: 'Deneyiminizi 1 ile 5 yıldız arasında puanlayın.',
      });
      return;
    }
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Giriş Gerekli', description: 'Geri bildirim göndermek için giriş yapmalısınız.'});
        return;
    }

    setIsSubmitting(true);
    try {
        const result = await submitFeedback({
            userId: currentUser.uid,
            userName: currentUser.displayName || 'Bilinmiyor',
            userAvatar: currentUser.photoURL || '',
            rating: rating,
            comment: comment
        });

        if (result.success) {
            toast({
                title: 'Geri Bildiriminiz Alındı!',
                description: 'Değerli görüşleriniz için teşekkür ederiz.',
                className: 'bg-green-500 text-white',
            });
            router.push('/profile/edit');
        } else {
            throw new Error(result.error || 'Bilinmeyen bir hata oluştu.');
        }

    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        variant: 'destructive',
        title: 'Gönderim Başarısız',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Deneyiminizi Paylaşın</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
            <p className="font-medium">Genel deneyiminizi nasıl puanlarsınız?</p>
            <div className="flex justify-center gap-2">
            {[...Array(5)].map((_, index) => {
                const starRating = index + 1;
                return (
                <Star
                    key={starRating}
                    className={cn(
                    'w-10 h-10 cursor-pointer transition-colors',
                    starRating <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground/30'
                    )}
                    onClick={() => setRating(starRating)}
                    onMouseEnter={() => setHoverRating(starRating)}
                    onMouseLeave={() => setHoverRating(0)}
                />
                );
            })}
            </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="comment" className="font-medium">
            Eklemek istediğiniz bir şey var mı? (İsteğe bağlı)
          </label>
          <Textarea
            id="comment"
            placeholder="Neleri beğendiniz veya neleri geliştirebiliriz?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px]"
            disabled={isSubmitting}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            'Geri Bildirimi Gönder'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
