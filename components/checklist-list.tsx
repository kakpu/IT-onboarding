'use client';

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

type UserProgress = {
  checklist_item_id: string;
  status: 'pending' | 'resolved' | 'unresolved';
};

type ChecklistListProps = {
  items: ChecklistItem[];
  progress: UserProgress[];
};

/**
 * チェックリスト項目リストコンポーネント
 * @param items - チェックリスト項目の配列
 * @param progress - ユーザー進捗データの配列
 */
export function ChecklistList({ items, progress }: ChecklistListProps) {
  if (!items || items.length === 0) {
    return <p className="text-gray-600">チェックリスト項目がありません</p>;
  }

  // 進捗データをMapに変換して高速検索
  const progressMap = new Map(progress.map((p) => [p.checklist_item_id, p.status]));

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ChecklistCard key={item.id} item={item} status={progressMap.get(item.id) || 'pending'} />
      ))}
    </div>
  );
}
