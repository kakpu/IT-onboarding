'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserId } from '@/lib/user';

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

  const updateProgress = useMutation({
    mutationFn: async (newStatus: 'resolved' | 'unresolved') => {
      const res = await fetch(`/api/progress/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, userId: getUserId() }),
      });
      if (!res.ok) throw new Error('進捗の更新に失敗しました');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      setCurrentStatus(variables);
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
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
      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={() => updateProgress.mutate('resolved')}
          disabled={updateProgress.isPending}
        >
          ✓ 解決した
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => updateProgress.mutate('unresolved')}
          disabled={updateProgress.isPending}
        >
          ✗ 解決しなかった
        </Button>
      </div>

      {/* 戻るリンク */}
      <Link href={`/day/${day}`}>
        <Button variant="outline" className="w-full">
          ← Day{day}に戻る
        </Button>
      </Link>
    </div>
  );
}
