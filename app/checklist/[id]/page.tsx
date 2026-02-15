import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChecklistDetailClient } from '@/components/checklist-detail-client';
import type { ChecklistItem } from '@/lib/types';

/** カテゴリの日本語ラベル */
const CATEGORY_LABELS: Record<string, string> = {
  login: 'ログイン',
  m365: 'M365',
  teams: 'Teams',
  iphone: 'iPhone',
  mail: 'メール',
  portal: 'ポータル',
  printer: 'プリンタ',
  vpn: 'VPN',
  security: 'セキュリティ',
  storage: 'ストレージ',
  expense: '経費精算',
  trouble: 'トラブル対応',
};

/**
 * チェックリスト項目詳細ページ
 */
export default async function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !item) {
    notFound();
  }

  const checklistItem = item as ChecklistItem;
  const categoryLabel = CATEGORY_LABELS[checklistItem.category] || checklistItem.category;

  // stepsがJSON文字列の場合はパースする
  const steps =
    typeof checklistItem.steps === 'string' ? JSON.parse(checklistItem.steps) : checklistItem.steps;

  return (
    <div className="container mx-auto max-w-2xl p-4">
      {/* パンくずリスト */}
      <nav className="mb-4 text-sm text-gray-600">
        <Link href="/" className="hover:underline">
          ホーム
        </Link>
        {' > '}
        <Link href={`/day/${checklistItem.day}`} className="hover:underline">
          Day{checklistItem.day}
        </Link>
        {` > ${checklistItem.title}`}
      </nav>

      {/* カテゴリバッジ */}
      <span className="mb-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
        {categoryLabel}
      </span>

      {/* タイトル */}
      <h1 className="mb-2 text-2xl font-bold">{checklistItem.title}</h1>

      {/* 概要 */}
      <p className="mb-6 text-gray-600">{checklistItem.summary}</p>

      {/* 手順セクション */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">手順</h2>
        <ol className="space-y-2">
          {(steps as string[]).map((step, index) => (
            <li key={index} className="flex gap-3 rounded-lg border p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span className="text-sm">{step.replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 注意点セクション */}
      {checklistItem.notes && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">注意点</h2>
          <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">{checklistItem.notes}</p>
          </div>
        </section>
      )}

      {/* アクションボタン（クライアントコンポーネント） */}
      <ChecklistDetailClient itemId={checklistItem.id} day={checklistItem.day} />
    </div>
  );
}
