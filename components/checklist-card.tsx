'use client';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

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
  isCompleted: boolean;
  onToggle: (itemId: string, completed: boolean) => void;
};

/**
 * チェックリスト項目カードコンポーネント
 * @param item - チェックリスト項目
 * @param isCompleted - 完了状態
 * @param onToggle - チェック状態変更時のコールバック
 */
export function ChecklistCard({ item, isCompleted, onToggle }: ChecklistCardProps) {
  return (
    <Card className="flex items-start gap-4 p-4">
      <Checkbox
        id={item.id}
        checked={isCompleted}
        onCheckedChange={(checked) => onToggle(item.id, checked as boolean)}
        className="mt-1"
      />
      <div className="flex-1">
        <label
          htmlFor={item.id}
          className={`cursor-pointer ${isCompleted ? 'line-through text-gray-500' : ''}`}
        >
          <h3 className="font-semibold">{item.title}</h3>
          {item.summary && <p className="text-sm text-gray-600 mt-1">{item.summary}</p>}
        </label>
      </div>
    </Card>
  );
}
