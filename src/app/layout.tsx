import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Roboto } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'BeMatch',
  description: 'Find your perfect match and walk together',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#8a2be2" />
        <link rel="icon" href="/icons/heart.svg" type="image/svg+xml" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable, roboto.variable)}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
