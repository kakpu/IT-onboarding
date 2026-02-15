'use client';

import { useEffect, useState } from 'react';
import { getUserName } from '@/lib/user';

/**
 * ユーザー挨拶コンポーネント
 * ローカルストレージからユーザー名を取得して表示
 */
export function UserGreeting() {
  const [userName, setUserName] = useState('ゲスト');

  useEffect(() => {
    // クライアントサイドでユーザー名を取得
    setUserName(getUserName() || 'ゲスト');
  }, []);

  return (
    <p className="text-sm text-gray-600" suppressHydrationWarning>
      こんにちは、<span className="font-semibold">{userName}</span>さん
    </p>
  );
}
