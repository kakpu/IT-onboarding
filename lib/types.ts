/** チェックリスト項目の型 */
export type ChecklistItem = {
  id: string;
  day: number;
  category: string;
  title: string;
  summary: string;
  steps: string[];
  notes: string | null;
  order_index: number;
  is_active: boolean;
};

/** ユーザー進捗の状態 */
export type ProgressStatus = 'pending' | 'resolved' | 'unresolved';

/** ユーザー進捗 */
export type UserProgress = {
  checklist_item_id: string;
  status: ProgressStatus;
};
