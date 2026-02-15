import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { UserGreeting } from '@/components/user-greeting';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'ITオンボーディング',
  description: 'Day1-3のIT初期設定をサポート',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col">
        <Providers>
          <header className="border-b bg-white">
            <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:py-4">
              <h1 className="text-lg font-bold sm:text-xl">ITオンボーディング</h1>
              <UserGreeting />
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t bg-gray-50">
            <div className="container mx-auto p-4 text-center text-sm text-gray-600">
              © 2026 IT-onboarding
            </div>
          </footer>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
