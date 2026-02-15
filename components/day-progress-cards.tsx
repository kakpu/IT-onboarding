'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/progress-bar';
import { getUserId } from '@/lib/user';

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
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [dayItems, setDayItems] = useState<DayItemData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countRes, progressRes] = await Promise.all([
          fetch('/api/checklist-items/count'),
          fetch(`/api/progress/user/${getUserId()}`),
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
  }, []);

  // Day別の解決済み数を計算
  const getResolvedCount = (day: number) => {
    const dayData = dayItems.find((d) => d.day === day);
    if (!dayData) return 0;

    const resolvedIds = new Set(
      progress.filter((p) => p.status === 'resolved').map((p) => p.checklist_item_id)
    );

    return dayData.itemIds.filter((id) => resolvedIds.has(id)).length;
  };

  const totalItems = dayItems.reduce((sum, d) => sum + d.count, 0);
  const totalResolved = progress.filter((p) => p.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* 全体の進捗 */}
      {totalItems > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-2 font-semibold">全体の進捗</h2>
          <ProgressBar completed={totalResolved} total={totalItems} />
        </div>
      )}

      {/* Day別カード */}
      <div className="grid gap-6 md:grid-cols-3">
        {DAYS.map(({ day, title, description }) => {
          const dayCount = dayItems.find((d) => d.day === day)?.count || 0;
          const dayResolved = getResolvedCount(day);

          return (
            <Card key={day} className="flex flex-col">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                {dayCount > 0 && <ProgressBar completed={dayResolved} total={dayCount} />}
                <Link href={`/day/${day}`}>
                  <Button className="w-full">詳細を見る →</Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
