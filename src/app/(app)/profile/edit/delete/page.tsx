
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Trash, PauseCircle } from 'lucide-react';

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
            Hesabınızı sildiğinizde, tüm eşleşmeleriniz, sohbetleriniz ve diğer verileriniz kalıcı olarak kaldırılacaktır.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="outline">
          <PauseCircle className="mr-2 h-4 w-4" />
          Hesabımı Askıya Al
        </Button>
        <Button variant="destructive">
          <Trash className="mr-2 h-4 w-4" />
          Hesabımı Kalıcı Olarak Sil
        </Button>
      </CardFooter>
    </Card>
  );
}
