'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ProgressBar } from '@/components/progress-bar';

const STORAGE_KEY = 'show_incomplete_only';

/** Day別の設定情報 */
const DAYS = [
  { day: 1, title: 'Day1 初期設定', description: 'ログイン・M365・Teams・iPhone初期設定' },
  {
    day: 2,
    title: 'Day2 ポータル・ツール設定',
    description: 'ポータル・プリンタ・VPN・セキュリティ確認',
  },
  { day: 3, title: 'Day3 トラブル対応', description: 'よくあるトラブル対応' },
];

type ProgressData = {
  checklist_item_id: string;
  status: string;
};

type DayItemData = {
  day: number;
  count: number;
  itemIds: string[];
};

/**
 * Day別進捗カードコンポーネント
 * クライアントサイドで進捗データを取得して表示
 */
export function DayProgressCards() {
  const { data: session } = useSession();
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [dayItems, setDayItems] = useState<DayItemData[]>([]);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  /** ローカルストレージからフィルター状態を復元 */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') {
      setShowIncompleteOnly(true);
    }
  }, []);

  /** フィルター状態をローカルストレージに保存 */
  const handleFilterChange = (checked: boolean) => {
    setShowIncompleteOnly(checked);
    localStorage.setItem(STORAGE_KEY, String(checked));
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchData = async () => {
      try {
        const [countRes, progressRes] = await Promise.all([
          fetch('/api/checklist-items/count'),
          fetch('/api/progress/me'),
        ]);

        if (countRes.ok) {
          setDayItems(await countRes.json());
        }
        if (progressRes.ok) {
          setProgress(await progressRes.json());
        }
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  const resolvedIds = new Set(
    progress.filter((p) => p.status === 'resolved').map((p) => p.checklist_item_id)
  );

  /** Day別の解決済み数を計算 */
  const getResolvedCount = (day: number) => {
    const dayData = dayItems.find((d) => d.day === day);
    if (!dayData) return 0;
    return dayData.itemIds.filter((id) => resolvedIds.has(id)).length;
  };

  /** Day別の未完了数を計算 */
  const getIncompleteCount = (day: number) => {
    const dayData = dayItems.find((d) => d.day === day);
    if (!dayData) return 0;
    return dayData.itemIds.filter((id) => !resolvedIds.has(id)).length;
  };

  const totalItems = dayItems.reduce((sum, d) => sum + d.count, 0);
  const totalResolved = progress.filter((p) => p.status === 'resolved').length;
  const allCompleted = totalItems > 0 && totalResolved === totalItems;

  return (
    <div className="space-y-6">
      {/* 全体の進捗 */}
      {totalItems > 0 && (
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">全体の進捗</h2>
            <div className="flex items-center gap-2">
              <Switch
                id="show-incomplete"
                checked={showIncompleteOnly}
                onCheckedChange={handleFilterChange}
              />
              <Label htmlFor="show-incomplete" className="text-sm cursor-pointer">
                未完了のみ表示
              </Label>
            </div>
          </div>
          <ProgressBar completed={totalResolved} total={totalItems} />
          {allCompleted && (
            <div className="mt-3 rounded-md bg-green-50 p-3 text-center text-sm text-green-700">
              すべてのタスクが完了しました！
            </div>
          )}
        </div>
      )}

      {/* Day別カード */}
      <div className="grid gap-4 sm:gap-6 landscape:grid-cols-3 lg:grid-cols-3">
        {DAYS.map(({ day, title, description }) => {
          const dayCount = dayItems.find((d) => d.day === day)?.count || 0;
          const dayResolved = getResolvedCount(day);
          const dayIncomplete = getIncompleteCount(day);

          /* フィルターON時に未完了0件のDayカードは非表示 */
          if (showIncompleteOnly && dayIncomplete === 0 && dayCount > 0) {
            return null;
          }

          return (
            <Card key={day} className="flex flex-col">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                {dayCount > 0 &&
                  (showIncompleteOnly ? (
                    <p className="text-sm text-gray-600">残り {dayIncomplete} 件</p>
                  ) : (
                    <ProgressBar completed={dayResolved} total={dayCount} />
                  ))}
                <Link href={`/day/${day}`}>
                  <Button className="min-h-[44px] w-full">詳細を見る →</Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
