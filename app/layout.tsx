import type { Metadata } from 'next';
import './globals.css';
import { UserSetupDialog } from '@/components/user-setup-dialog';

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
      <body>
        {children}
        <UserSetupDialog />
      </body>
    </html>
  );
}
