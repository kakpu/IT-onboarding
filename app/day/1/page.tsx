import Link from 'next/link';
import { ChecklistList } from '@/components/checklist-list';
import { createClient } from '@/lib/supabase/server';

/**
 * チェックリスト項目を取得
 * @param day - 日数（1, 2, 3）
 * @returns チェックリスト項目の配列
 */
async function getChecklistItems(day: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('day', day)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('チェックリスト項目の取得に失敗しました:', error);
    throw new Error('チェックリスト項目の取得に失敗しました');
  }

  return data || [];
}

/**
 * Day1チェックリストページ
 */
export default async function Day1Page() {
  const items = await getChecklistItems(1);
  // 進捗データは空配列で初期化（クライアント側で更新される）
  const progress: Array<{
    checklist_item_id: string;
    status: 'pending' | 'resolved' | 'unresolved';
  }> = [];

  return (
    <div className="container mx-auto p-4">
      {/* パンくずリスト */}
      <nav className="text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:underline">
          ホーム
        </Link>
        {' > Day1'}
      </nav>

      {/* ページタイトル */}
      <h1 className="text-2xl font-bold mb-6">Day1 初期設定</h1>

      {/* チェックリスト */}
      <ChecklistList items={items} progress={progress} />
    </div>
  );
}
