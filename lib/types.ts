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

/** ランキング項目（管理ダッシュボード用） */
export type RankedItem = {
  checklistItemId: string;
  title: string;
  count: number;
};

/** 管理ダッシュボード統計データ */
export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  completionRate: number;
  topUnresolvedItems: RankedItem[];
  mostViewedItems: RankedItem[];
};
