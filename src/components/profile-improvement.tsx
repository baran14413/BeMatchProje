'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestImprovements } from '@/app/(app)/profile/actions';
import { type ProfileImprovementOutput } from '@/ai/flows/profile-improvement-suggestions';
import { Wand2, Sparkles, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const formSchema = z.object({
  profileText: z.string().min(20, { message: 'Biyografi en az 20 karakter olmalıdır.' }),
  interests: z.string().min(3, { message: 'En az bir ilgi alanı belirtmelisiniz.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ProfileImprovementProps {
  currentProfile: string;
  currentInterests: string;
}

export default function ProfileImprovement({ currentProfile, currentInterests }: ProfileImprovementProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileImprovementOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileText: currentProfile || '',
      interests: currentInterests || '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    const response = await suggestImprovements(data);

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error || 'Bilinmeyen bir hata oluştu.');
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="text-primary" />
          Yapay Zeka ile Profilini Güçlendir
        </CardTitle>
        <CardDescription>
          Profilini daha çekici hale getirmek ve harika sohbetler başlatmak için öneriler al.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="profileText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mevcut Biyografin</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Kendinden bahset..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İlgi Alanların (virgülle ayır)</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Seyahat, Müzik, Spor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Öneri Al'}
              {!loading && <Sparkles className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </Form>

        {error && <Alert variant="destructive" className="mt-6"><AlertTitle>Hata</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        {result && (
          <div className="mt-8 space-y-6">
            <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle className="font-bold">İşte Önerilerimiz!</AlertTitle>
                <AlertDescription>
                    Bu önerileri profilini güncellemek ve sohbet başlatmak için kullanabilirsin.
                </AlertDescription>
            </Alert>
            
            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg">Geliştirilmiş Profil Metni</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">"{result.improvedProfile}"</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg">Buzları Kıracak Konu Başlıkları</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  {result.icebreakerSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
