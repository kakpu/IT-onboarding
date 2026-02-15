import type { Metadata } from 'next';
import './globals.css';
import { UserSetupDialog } from '@/components/user-setup-dialog';
import { UserGreeting } from '@/components/user-greeting';

export const metadata: Metadata = {
  title: 'ITオンボーディング',
  description: 'Day1-3のIT初期設定をサポート',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col">
        <header className="border-b bg-white">
          <div className="container mx-auto flex items-center justify-between p-4">
            <h1 className="text-xl font-bold">ITオンボーディング</h1>
            <UserGreeting />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t bg-gray-50">
          <div className="container mx-auto p-4 text-center text-sm text-gray-600">
            © 2026 IT-onboarding
          </div>
        </footer>

        <UserSetupDialog />
      </body>
    </html>
  );
}
