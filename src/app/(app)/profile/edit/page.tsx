
'use client';

import React from 'react';
import {
  User,
  Shield,
  KeyRound,
  Bell,
  SlidersHorizontal,
  ChevronRight,
  Palette,
  Filter,
  Settings as Cog,
  HelpCircle,
  Trash2,
  LogOut,
  Store,
  Wallet,
  Lock,
  Ban,
  History,
  ImageIcon,
  Camera,
  Gem,
  Bookmark,
  Download,
  Users,
  ShieldAlert,
  Code,
  Database,
  Star,
  MessageSquareQuote
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  href?: string;
  onClick?: () => void;
  value?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, href, onClick, value, isFirst, isLast }) => {
  const content = (
    <div className={cn(
      "flex items-center p-4 transition-colors hover:bg-muted/50",
       isFirst && "rounded-t-lg",
       isLast && "rounded-b-lg",
       onClick && "cursor-pointer"
    )} onClick={onClick}>
      <div className="mr-4 text-muted-foreground">{icon}</div>
      <div className="flex-1 font-medium">{title}</div>
      <div className="flex items-center text-muted-foreground">
          {value && <span className="mr-2 text-sm">{value}</span>}
          <ChevronRight className="h-5 w-5" />
      </div>
    </div>
  );

  if (href && !onClick) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
};

const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="px-4 py-2 text-sm font-semibold text-primary">{title}</h2>
);

export default function EditProfilePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [installPrompt, setInstallPrompt] = React.useState<any>(null);

    React.useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) {
            toast({
                title: 'Uygulama Zaten Yüklü',
                description: 'Veya tarayıcınız bu özelliği desteklemiyor.',
            });
            return;
        }
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                toast({ title: 'Uygulama başarıyla yüklendi!' });
            } else {
                 toast({ title: 'Yükleme iptal edildi.', variant: 'destructive' });
            }
            setInstallPrompt(null);
        });
    };
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({
                title: 'Çıkış Yapıldı',
                description: 'Başarıyla çıkış yaptınız. Yönlendiriliyorsunuz...',
            });
            router.push('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
            toast({
                variant: 'destructive',
                title: 'Çıkış Yapılamadı',
                description: 'Çıkış yaparken bir hata oluştu. Lütfen tekrar deneyin.',
            });
        }
    };

    const accountItems = [
        { icon: <User className="h-6 w-6" />, title: 'Profili Düzenle', href: '/profile/edit/personal' },
        { icon: <Camera className="h-6 w-6" />, title: 'Profil Fotoğrafı Düzenle', href: '/profile/edit/picture' },
        { icon: <ImageIcon className="h-6 w-6" />, title: 'Gönderilerini Yönet', href: '/profile/edit/photos' },
        { icon: <Bookmark className="h-6 w-6" />, title: 'Kaydedilen Gönderiler', href: '/profile/edit/saved-posts' },
    ];
    
    const premiumItems = [
        { icon: <Gem className="h-6 w-6" />, title: 'BeMatch Premium', href: '/premium' },
        { icon: <Wallet className="h-6 w-6" />, title: 'Cüzdanım', href: '/profile/edit/wallet' },
    ];

    const contentPreferenceItems = [
        { icon: <Filter className="h-6 w-6" />, title: 'Ana Akış Ayarları', href: '/profile/edit/discovery' },
    ];

    const privacyAndSecurityItems = [
        { icon: <Lock className="h-6 w-6" />, title: 'Hesap Gizliliği', href: '/profile/edit/privacy' },
        { icon: <KeyRound className="h-6 w-6" />, title: 'E-posta & Şifre', href: '/profile/edit/security' },
        { icon: <History className="h-6 w-6" />, title: 'Oturum Yönetimi', href: '/profile/edit/sessions' },
        { icon: <Ban className="h-6 w-6" />, title: 'Engellenen Hesaplar', href: '/profile/edit/blocked' },
    ];
    
    const appearanceItems = [
        { icon: <Palette className="h-6 w-6" />, title: 'Görünüm', href: '/profile/edit/appearance' },
    ];
    
    const applicationItems = [
        { icon: <Bell className="h-6 w-6" />, title: 'Bildirim Ayarları', href: '/profile/edit/notifications' },
        { icon: <Database className="h-6 w-6" />, title: 'Önbellek Yönetimi', href: '/profile/edit/cache' },
        { icon: <Download className="h-6 w-6" />, title: 'Uygulamayı Yükle', onClick: handleInstallClick },
        { icon: <MessageSquareQuote className="h-6 w-6" />, title: 'Deneyimlerinizi Paylaşın', href: '/profile/edit/feedback' },
        { icon: <HelpCircle className="h-6 w-6" />, title: 'Uygulama Kılavuzu', href: '/profile/edit/guide' },
        { icon: <Code className="h-6 w-6" />, title: 'Teknoloji Kümesi', href: '/profile/edit/tech-stack' },
    ];

    const otherItems = [
        { icon: <Trash2 className="h-6 w-6" />, title: 'Hesabı Sil', href: '/profile/edit/delete' },
        { icon: <LogOut className="h-6 w-6" />, title: 'Çıkış Yap', onClick: handleLogout },
    ];

  return (
    <div className="space-y-4">
        <div>
            <SectionTitle title="Hesap" />
            <Card>
                <CardContent className="p-0">
                    {accountItems.map((item, index) => (
                        <React.Fragment key={item.title}>
                            <SettingsItem 
                                icon={item.icon} 
                                title={item.title} 
                                href={item.href}
                                isFirst={index === 0}
                                isLast={index === accountItems.length -1}
                            />
                            {index < accountItems.length - 1 && <Separator className="bg-border/50" />}
                        </React.Fragment>
                    ))}
                </CardContent>
            </Card>
        </div>
        <div>
            <SectionTitle title="Premium" />
            <Card>
                <CardContent className="p-0">
                    {premiumItems.map((item, index) => (
                        <React.Fragment key={item.title}>
                            <SettingsItem 
                                icon={item.icon} 
                                title={item.title} 
                                href={item.href}
                                isFirst={index === 0}
                                isLast={index === premiumItems.length -1}
                            />
                            {index < premiumItems.length - 1 && <Separator className="bg-border/50" />}
                        </React.Fragment>
                    ))}
                </CardContent>
            </Card>
        </div>
        <div>
            <SectionTitle title="İçerik Tercihleri" />
            <Card>
                <CardContent className="p-0">
                    {contentPreferenceItems.map((item, index) => (
                         <React.Fragment key={item.title}>
                            <SettingsItem
                                icon={item.icon}
                                title={item.title}
                                href={item.href}
                                isFirst={index === 0}
                                isLast={index === contentPreferenceItems.length -1}
                            />
                             {index < contentPreferenceItems.length - 1 && <Separator className="bg-border/50" />}
                        </React.Fragment>
                    ))}
                </CardContent>
            </Card>
        </div>
        <div>
            <SectionTitle title="Gizlilik ve Güvenlik" />
            <Card>
                <CardContent className="p-0">
                    {privacyAndSecurityItems.map((item, index) => (
                         <React.Fragment key={item.title}>
                            <SettingsItem
                                icon={item.icon}
                                title={item.title}
                                href={item.href}
                                isFirst={index === 0}
                                isLast={index === privacyAndSecurityItems.length -1}
                            />
                             {index < privacyAndSecurityItems.length - 1 && <Separator className="bg-border/50" />}
                        </React.Fragment>
                    ))}
                </CardContent>
            </Card>
        </div>
        <div>
            <SectionTitle title="Uygulama Ayarları" />
            <Card>
                <CardContent className="p-0">
                    {appearanceItems.map((item, index) => (
                        <React.Fragment key={item.title}>
                            <SettingsItem 
                                icon={item.icon} 
                                title={item.title} 
                                href={item.href}
                                isFirst={index === 0}
                                isLast={index === appearanceItems.length -1}
                            />
                            {index < appearanceItems.length - 1 && <Separator className="bg-border/50" />}
                        </React.Fragment>
                    ))}
                     <Separator className="bg-border/50" />
                     {applicationItems.map((item, index) => (
                         <React.Fragment key={item.title}>
                            <SettingsItem
                                icon={item.icon}
                                title={item.title}
                                href={item.href}
                                onClick={item.onClick}
                                isFirst={index === 0 && appearanceItems.length === 0}
                                isLast={index === applicationItems.length -1}
                            />
                             {index < applicationItems.length - 1 && <Separator className="bg-border/50" />}
                        </React.Fragment>
                    ))}
                </CardContent>
            </Card>
        </div>
        
        <div>
            <SectionTitle title="Diğer" />
            <Card>
                <CardContent className="p-0">
                    {otherItems.map((item, index) => (
                         <React.Fragment key={item.title}>
                            <SettingsItem
                                icon={item.icon}
                                title={item.title}
                                href={item.href}
                                onClick={item.onClick}
                                isFirst={index === 0}
                                isLast={index === otherItems.length -1}
                            />
                             {index < otherItems.length - 1 && <Separator className="bg-border/50" />}
                        </React.Fragment>
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
