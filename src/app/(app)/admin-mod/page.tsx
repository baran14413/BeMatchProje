
'use client';

import React from 'react';
import { ChevronRight, MessageSquareWarning } from 'lucide-react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ModCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const ModCard: React.FC<ModCardProps> = ({ icon, title, description, href }) => {
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

export default function AdminModDashboardPage() {
  const moderationItems = [
    { 
      icon: <MessageSquareWarning className="h-7 w-7 text-primary" />, 
      title: 'Şikayet Yönetimi', 
      description: 'Kullanıcılar tarafından şikayet edilen içerikleri inceleyin ve işlem yapın.', 
      href: '/admin-mod/reported-content' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {moderationItems.map((item, index) => (
          <ModCard key={index} {...item} />
        ))}
      </div>
    </div>
  );
}
