'use client';

import { useState } from 'react';
import { ChecklistCard } from './checklist-card';

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

type ChecklistListProps = {
  items: ChecklistItem[];
};

/**
 * チェックリスト項目リストコンポーネント
 * @param items - チェックリスト項目の配列
 */
export function ChecklistList({ items }: ChecklistListProps) {
  // ローカルステートで完了状態を管理（Issue #7で API連携に変更予定）
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const handleToggle = (itemId: string, completed: boolean) => {
    setCompletedItems((prev) => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  if (!items || items.length === 0) {
    return <p className="text-gray-600">チェックリスト項目がありません</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ChecklistCard
          key={item.id}
          item={item}
          isCompleted={completedItems.has(item.id)}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
