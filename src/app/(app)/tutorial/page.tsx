
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Home, MessageCircle, Shuffle, Sparkles, User, Globe } from 'lucide-react';

const tutorialSteps = [
  {
    icon: <Sparkles className="w-24 h-24 text-primary" />,
    title: 'BeMatch\'e Hoş Geldin!',
    description: 'Harika bir yolculuğa çıkmak üzeresin. Uygulamanın temel özelliklerini birlikte keşfedelim.',
  },
  {
    icon: <Home className="w-24 h-24 text-primary" />,
    title: 'Ana Akış',
    description: 'Burası senin ana keşif alanın. Sana uygun olduğunu düşündüğümüz profilleri burada görebilir ve onlarla etkileşim kurabilirsin.',
  },
  {
    icon: <Shuffle className="w-24 h-24 text-primary" />,
    title: 'Rastgele Eşleşme',
    description: 'Heyecan mı arıyorsun? Tek bir tuşa basarak o an eşleşme arayan biriyle 5 dakikalık sürpriz bir sohbete başla!',
  },
  {
    icon: <Globe className="w-24 h-24 text-primary" />,
    title: 'Keşfet',
    description: 'Tüm topluluğun paylaştığı fotoğraf ve yazıları gör. Trend olan etiketleri takip et ve yeni insanlarla tanış.',
  },
  {
    icon: <MessageCircle className="w-24 h-24 text-primary" />,
    title: 'Sohbet',
    description: 'Eşleştiğin kişilerle güvenli bir şekilde mesajlaş. Unutma, rastgele sohbetlerde kalıcı bir bağ kurmak için ikinizin de onayı gerekiyor.',
  },
  {
    icon: <User className="w-24 h-24 text-primary" />,
    title: 'Profilin',
    description: 'Burası senin vitrinin. Profilini dilediğin gibi düzenle, en iyi fotoğraflarını paylaş ve kendini topluluğa tanıt.',
  },
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 500 : -500,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 500 : -500,
    opacity: 0,
  }),
};

export default function TutorialPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      router.push('/match');
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const currentStep = tutorialSteps[step];
  const progress = ((step + 1) / tutorialSteps.length) * 100;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-hidden">
      <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center">
            <AnimatePresence initial={false} custom={direction}>
                 <motion.div
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                    }}
                    className="flex flex-col items-center justify-center h-48"
                >
                    <div className="mb-6">{currentStep.icon}</div>
                    <CardTitle className="text-2xl font-headline">{currentStep.title}</CardTitle>
                 </motion.div>
            </AnimatePresence>
        </CardHeader>
        <CardContent className="text-center min-h-[80px]">
            <AnimatePresence initial={false} custom={direction}>
                 <motion.div
                    key={step + '-desc'}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        delay: 0.1,
                        x: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                    }}
                 >
                    <CardDescription>{currentStep.description}</CardDescription>
                 </motion.div>
             </AnimatePresence>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Progress value={progress} className="w-full" />
          <div className="w-full flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={step === 0}>
              Geri
            </Button>
            <Button onClick={handleNext}>
              {step === tutorialSteps.length - 1 ? 'Keşfetmeye Başla' : 'İleri'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
