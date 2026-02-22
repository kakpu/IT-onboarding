'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * グローバルエラーバウンダリ
 * サーバーエラー発生時に表示される
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('アプリケーションエラー:', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-2 text-2xl font-bold">エラーが発生しました</h2>
      <p className="mb-6 text-gray-600">申し訳ありません。予期しないエラーが発生しました。</p>
      <div className="flex gap-3">
        <Button onClick={reset} className="min-h-[44px]">
          再試行する
        </Button>
        <Button
          variant="outline"
          className="min-h-[44px]"
          onClick={() => (window.location.href = '/')}
        >
          トップに戻る
        </Button>
      </div>
    </div>
  );
}
