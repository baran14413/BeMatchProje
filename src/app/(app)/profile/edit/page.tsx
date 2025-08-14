
'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, Monitor, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';

// Redirect to the personal settings page by default
export default function EditProfileRedirectPage() {
    redirect('/profile/edit/personal');
}
