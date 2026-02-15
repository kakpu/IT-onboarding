'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getUserId, setUserName, hasUser } from '@/lib/user';

/**
 * ユーザーセットアップダイアログ
 * 初回アクセス時に表示され、名前を入力してもらう
 */
export function UserSetupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 初回アクセス時のみダイアログを表示
    if (!hasUser()) {
      setOpen(true);
    }
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const userId = getUserId();
      const userName = name || 'ゲスト';
      setUserName(userName);

      // Supabase users テーブルに保存
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, name: userName }),
      });

      if (!response.ok) {
        throw new Error('ユーザー作成に失敗しました');
      }

      setOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ようこそ！</DialogTitle>
          <DialogDescription>
            ITオンボーディングシステムへようこそ。
            <br />
            お名前を入力してください（任意）。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="お名前を入力してください"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSubmit();
              }
            }}
            disabled={isLoading}
          />
          <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
            {isLoading ? '処理中...' : '次へ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
