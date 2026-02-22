'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CONTACT_URL, CONTACT_LABEL } from '@/lib/config';
import { sendLog } from '@/lib/log';

type ChecklistDetailClientProps = {
  itemId: string;
  day: number;
};

/**
 * 詳細ページのアクションボタン（クライアントコンポーネント）
 */
export function ChecklistDetailClient({ itemId, day }: ChecklistDetailClientProps) {
  const queryClient = useQueryClient();
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'resolved' | 'unresolved'>(
    'pending'
  );
  const [copied, setCopied] = useState(false);

  // ページ閲覧ログを記録
  useEffect(() => {
    sendLog('view', itemId);
  }, [itemId]);

  /** 現在のページURLをクリップボードにコピー */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      sendLog('share_link', itemId);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック: clipboard APIが使えない場合
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      sendLog('share_link', itemId);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [itemId]);

  const updateProgress = useMutation({
    mutationFn: async (newStatus: 'resolved' | 'unresolved') => {
      const res = await fetch(`/api/progress/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('進捗の更新に失敗しました');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      setCurrentStatus(variables);
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      sendLog(variables === 'resolved' ? 'resolve' : 'unresolve', itemId);
    },
  });

  return (
    <div className="space-y-4">
      {/* ステータス表示 */}
      {currentStatus !== 'pending' && (
        <div
          className={`rounded-lg p-3 text-center font-semibold ${
            currentStatus === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {currentStatus === 'resolved' ? '✓ 解決済み' : '✗ 未解決'}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          className="min-h-[44px] flex-1"
          onClick={() => updateProgress.mutate('resolved')}
          disabled={updateProgress.isPending}
        >
          ✓ 解決した
        </Button>
        <Button
          variant="destructive"
          className="min-h-[44px] flex-1"
          onClick={() => updateProgress.mutate('unresolved')}
          disabled={updateProgress.isPending}
        >
          ✗ 解決しなかった
        </Button>
      </div>

      {/* リンク共有ボタン */}
      <Button variant="secondary" className="min-h-[44px] w-full" onClick={handleCopyLink}>
        {copied ? '✓ コピーしました！' : '🔗 この手順を送る'}
      </Button>

      {/* 問い合わせボタン */}
      <a
        href={CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => sendLog('contact_click', itemId)}
      >
        <Button variant="outline" className="min-h-[44px] w-full">
          💬 {CONTACT_LABEL}
        </Button>
      </a>

      {/* 戻るリンク */}
      <Link href={`/day/${day}`}>
        <Button variant="outline" className="min-h-[44px] w-full">
          ← Day{day}に戻る
        </Button>
      </Link>
    </div>
  );
}
