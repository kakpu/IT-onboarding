# Issue #13: トップページ進捗サマリー表示

## 背景 / 目的

トップページに全体進捗率とDay別進捗カードを表示する。これにより、ユーザーが一目で現在の進捗状況を把握できる。

- **依存**: #12
- **ラベル**: frontend

## スコープ / 作業項目

1. `/app/page.tsx`を動的ページに変更
2. GET /api/progress?userId=XXXを呼び出し
3. 全体進捗率（完了数/全体数）を計算・表示
4. Day別進捗カードに進捗バー表示
5. React Queryでデータフェッチ・キャッシング
6. ローディング状態・エラー状態のUI実装

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/page.tsx`を動的ページに変更（Server ComponentからClient Componentに変更）
- [ ] GET /api/progress?userId=XXXを呼び出し、進捗データ取得成功
- [ ] 全体進捗率（完了数/全体数）を計算・表示
- [ ] Day別進捗カードに進捗バー表示（例: 3/4完了）
- [ ] React Queryでデータフェッチ、キャッシング設定
- [ ] ローディング状態・エラー状態のUI実装

## テスト観点

- **進捗率表示**: トップページに全体進捗率が正しく表示されること
- **Day別進捗**: Day1, 2, 3の進捗バーが正しく表示されること
- **ローディング状態**: データ取得中はローディングスピナーが表示されること
- **エラー状態**: API呼び出しが失敗した場合、エラーメッセージが表示されること
- **キャッシング**: 2回目以降のアクセスでキャッシュが使用されること

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# ブラウザでアクセス
# http://localhost:3000

# DevTools > Networkタブでキャッシング確認
```

## 実装例

### /app/page.tsx

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserId } from '@/lib/user';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

async function fetchProgress(userId: string) {
  const res = await fetch(`/api/progress?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json();
}

export default function HomePage() {
  const userId = getUserId();

  const { data, isLoading, error } = useQuery({
    queryKey: ['progress', userId],
    queryFn: () => fetchProgress(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-600">エラーが発生しました</p>
      </div>
    );
  }

  const { summary, progress } = data || { summary: {}, progress: [] };

  // Day別進捗を計算
  const dayProgress = [1, 2, 3].map((day) => {
    const items = progress.filter((p: any) => p.checklistItem.day === day);
    const resolved = items.filter((p: any) => p.status === 'resolved').length;
    return {
      day,
      total: items.length,
      resolved,
      percentage: items.length > 0 ? Math.round((resolved / items.length) * 100) : 0,
    };
  });

  const overallPercentage = summary.total > 0
    ? Math.round((summary.resolved / summary.total) * 100)
    : 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ITオンボーディング</h1>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">
          全体の進捗: {overallPercentage}% ({summary.resolved}/{summary.total})
        </p>
        <Progress value={overallPercentage} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {dayProgress.map(({ day, total, resolved, percentage }) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle>Day{day} {getDayTitle(day)}</CardTitle>
              <CardDescription>{getDayDescription(day)}</CardDescription>
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  {percentage}% ({resolved}/{total})
                </p>
                <Progress value={percentage} />
              </div>
            </CardHeader>
            <Link href={`/day/${day}`}>
              <Button className="w-full">詳細を見る →</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getDayTitle(day: number) {
  const titles = {
    1: '初期設定',
    2: 'ポータル・ツール設定',
    3: 'トラブル対応',
  };
  return titles[day as keyof typeof titles] || '';
}

function getDayDescription(day: number) {
  const descriptions = {
    1: 'ログイン・M365・Teams・iPhone初期設定',
    2: 'ポータル・プリンタ・VPN・セキュリティ確認',
    3: 'よくあるトラブル対応',
  };
  return descriptions[day as keyof typeof descriptions] || '';
}
```

### /app/providers.tsx（React Query Provider）

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1分間キャッシュ
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### /app/layout.tsx（Providers追加）

```typescript
import { Providers } from './providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          {/* ... */}
          {children}
          {/* ... */}
        </Providers>
      </body>
    </html>
  );
}
```

## 要確認事項

- React Queryの`staleTime`は1分で適切か？（調整可能）
