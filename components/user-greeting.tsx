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

    // ユーザー名更新イベントをリスン
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setUserName(detail || 'ゲスト');
    };
    window.addEventListener('user-name-updated', handleUpdate);
    return () => window.removeEventListener('user-name-updated', handleUpdate);
  }, []);

  return (
    <p className="text-sm text-gray-600" suppressHydrationWarning>
      こんにちは、<span className="font-semibold">{userName}</span>さん
    </p>
  );
}
