'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Entra IDが設定されている場合のみボタンを表示する */
const isEntraIdEnabled = !!process.env.NEXT_PUBLIC_ENTRA_ID_ENABLED;

/**
 * ログインページ
 * メールアドレス＋パスワード認証と、Entra ID（企業SSO）認証を提供
 */
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ログイン</CardTitle>
          <CardDescription>ITオンボーディングシステム</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Entra ID（企業SSO）ログイン - 環境変数が設定されている場合のみ表示 */}
          {isEntraIdEnabled && (
            <>
              <Button
                type="button"
                variant="outline"
                className="mb-4 min-h-[44px] w-full"
                onClick={() => signIn('microsoft-entra-id', { callbackUrl: '/' })}
              >
                会社のアカウントでログイン（Entra ID）
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-gray-500">または</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@company.co.jp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="min-h-[44px]"
              />
            </div>

            <Button type="submit" className="min-h-[44px] w-full" disabled={isLoading}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:underline">
                新規登録
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
