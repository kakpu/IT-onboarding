'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

/**
 * ユーザー挨拶コンポーネント
 * NextAuthセッションからユーザー名を取得して表示
 */
export function UserGreeting() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'ゲスト';

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-gray-600">
        こんにちは、<span className="font-semibold">{userName}</span>さん
      </p>
      {session && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ログアウト
        </Button>
      )}
    </div>
  );
}
