'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserId } from '@/lib/user';

type ChecklistItem = {
  id: string;
  day: number;
  category: string;
  title: string;
  summary: string;
  steps: Array<string>;
  notes: string | null;
  order_index: number;
  is_active: boolean;
};

type ChecklistCardProps = {
  item: ChecklistItem;
  status?: 'pending' | 'resolved' | 'unresolved';
};

/**
 * チェックリスト項目カードコンポーネント
 * @param item - チェックリスト項目
 * @param status - 進捗状態
 */
export function ChecklistCard({ item, status: initialStatus = 'pending' }: ChecklistCardProps) {
  const queryClient = useQueryClient();
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'resolved' | 'unresolved'>(
    initialStatus
  );

  const updateProgress = useMutation({
    mutationFn: async (newStatus: 'resolved' | 'unresolved') => {
      const res = await fetch(`/api/progress/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, userId: getUserId() }),
      });
      if (!res.ok) throw new Error('進捗の更新に失敗しました');
      return res.json();
    },
    onSuccess: (data, variables) => {
      // ローカルステートを即座に更新
      setCurrentStatus(variables);
      // チェックリストデータのキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.summary}</CardDescription>
        {currentStatus !== 'pending' && (
          <p className="text-sm font-semibold mt-2">
            {currentStatus === 'resolved' ? '✓ 解決済み' : '✗ 未解決'}
          </p>
        )}
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button
          variant="default"
          onClick={() => updateProgress.mutate('resolved')}
          disabled={updateProgress.isPending}
        >
          ✓ 解決した
        </Button>
        <Button
          variant="destructive"
          onClick={() => updateProgress.mutate('unresolved')}
          disabled={updateProgress.isPending}
        >
          ✗ 解決しなかった
        </Button>
      </CardFooter>
    </Card>
  );
}
