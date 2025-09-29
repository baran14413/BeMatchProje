
'use client';

import React from 'react';
import {
  Users,
  ShieldCheck,
  Ban,
  LineChart,
  ChevronRight,
  MessageSquareWarning,
  Star,
  Code,
  CreditCard,
  Bot,
  ShieldHalf,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const AdminCard: React.FC<AdminCardProps> = ({ icon, title, description, href }) => {
  return (
    <Link href={href} className="block group h-full">
      <Card className="h-full hover:border-primary transition-colors hover:shadow-lg">
        <CardHeader>
            <div className="flex justify-between items-start">
                 <div className="p-3 bg-muted rounded-md mb-4">{icon}</div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default function AdminDashboardPage() {
    const adminFeatures = [
        { icon: <Users className="h-7 w-7 text-primary" />, title: 'Kullanıcıları Yönet', description: 'Tüm kullanıcıları görüntüleyin, silin veya yetkilendirin.', href: '/admin/users' },
        { icon: <CreditCard className="h-7 w-7 text-primary" />, title: 'Ödeme Onayları', description: 'Kullanıcıların premium ödeme bildirimlerini yönetin.', href: '/admin/payment-confirmations' },
        { icon: <Eye className="h-7 w-7 text-primary" />, title: 'Şüpheli Girişler', description: 'Panele yapılan başarısız giriş denemelerini izleyin.', href: '/admin/suspicious-logins' },
        { icon: <MessageSquareWarning className="h-7 w-7 text-primary" />, title: 'Rapor Edilen İçerikler', description: 'Kullanıcı şikayetlerini inceleyin.', href: '/admin/reported-content' },
        { icon: <Star className="h-7 w-7 text-primary" />, title: 'Geri Bildirimler', description: 'Kullanıcıların uygulama hakkındaki görüşleri.', href: '/admin/feedback' },
        { icon: <ShieldCheck className="h-7 w-7 text-primary" />, title: 'Aktivite Kayıtları', description: 'Son kullanıcı aktivitelerini ve IP adreslerini görüntüleyin.', href: '/admin/activity-logs' },
        { icon: <Ban className="h-7 w-7 text-primary" />, title: 'Engellenen IP Adresleri', description: 'Uygulamaya erişimi engellenen IP adreslerini yönetin.', href: '/admin/blocked-ips' },
        { icon: <LineChart className="h-7 w-7 text-primary" />, title: 'Sistem Durumu', description: 'Uygulama metriklerini ve genel performansı izleyin.', href: '/admin/system-status' },
        { icon: <Code className="h-7 w-7 text-primary" />, title: 'Terminal', description: 'Doğrudan komutları çalıştırın ve logları izleyin.', href: '/admin/terminal' },
        { icon: <Bot className="h-7 w-7 text-primary" />, title: 'Gemini & AI', description: 'Yapay zeka modellerini ve güncellemelerini yönetin.', href: '/admin/gemini-updates' },
        { icon: <Code className="h-7 w-7 text-primary" />, title: 'Teknolojilerimiz', description: 'Uygulamanın arkasındaki teknoloji ve mimari.', href: '/admin/technologies' },
        { icon: <ShieldHalf className="h-7 w-7 text-primary" />, title: 'Moderatör Paneli', description: 'İçerik yönetimi ve moderasyon araçları.', href: '/admin-mod' },
    ];

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {adminFeatures.map((item, index) => (
                <AdminCard key={index} {...item} />
            ))}
        </div>
    </div>
  );
}
