import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChecklistList } from '@/components/checklist-list';
import { ContactButton } from '@/components/contact-button';
import { createClient } from '@/lib/supabase/server';

/** Day別の設定情報 */
const DAY_CONFIG: Record<number, { title: string; description: string }> = {
  1: { title: 'Day1 初期設定', description: 'ログイン・M365・Teams・iPhone初期設定' },
  2: {
    title: 'Day2 ポータル・ツール設定',
    description: 'ポータル・プリンタ・VPN・セキュリティ確認',
  },
  3: { title: 'Day3 トラブル対応', description: 'よくあるトラブルの対処法' },
};

/**
 * チェックリスト項目を取得
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
 * Day別チェックリストページ（Day1/Day2/Day3共通）
 */
export default async function DayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day: dayParam } = await params;
  const day = Number(dayParam);

  if (![1, 2, 3].includes(day)) {
    notFound();
  }

  const config = DAY_CONFIG[day];
  const items = await getChecklistItems(day);
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
        {` > ${config.title.split(' ')[0]}`}
      </nav>

      {/* ページタイトル */}
      <h1 className="text-xl font-bold mb-2 sm:text-2xl">{config.title}</h1>
      <p className="text-sm text-gray-600 mb-6 sm:text-base">{config.description}</p>

      {/* チェックリスト */}
      <ChecklistList items={items} progress={progress} />

      {/* 問い合わせ導線 */}
      <div className="mt-8 rounded-lg border bg-gray-50 p-4 text-center">
        <p className="mb-3 text-sm text-gray-600">解決しない場合は教育担当にお問い合わせください</p>
        <ContactButton />
      </div>
    </div>
  );
}
