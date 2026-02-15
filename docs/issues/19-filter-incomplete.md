# Issue #19: 未完了のみ表示フィルター

## 背景 / 目的

トップページに「未完了のみ表示」トグルスイッチを追加し、未完了項目のみを表示できるようにする。これにより、ユーザーが残りのタスクに集中できる。

- **依存**: #13, #18
- **ラベル**: frontend

## スコープ / 作業項目

1. トップページにトグルスイッチ（shadcn/ui Switch）追加
2. トグルON時に`status=pending,unresolved`でフィルタリング
3. React状態管理でフィルター状態を保持
4. フィルター適用時にDay別カードの項目数を再計算
5. ローカルストレージにフィルター状態を保存

## ゴール / 完了条件（Acceptance Criteria）

- [ ] トップページにトグルスイッチ（shadcn/ui Switch）追加
- [ ] トグルON時に`status=pending,unresolved`でフィルタリング
- [ ] React状態管理でフィルター状態を保持
- [ ] フィルター適用時にDay別カードの項目数を再計算
- [ ] ローカルストレージにフィルター状態を保存（次回訪問時に復元）

## テスト観点

- **フィルター動作**: トグルスイッチをONにすると、未完了項目のみが表示されること
- **Day別進捗**: フィルター適用時に、Day別カードの項目数が正しく再計算されること
- **ローカルストレージ**: ページをリロードしても、フィルター状態が復元されること
- **進捗率**: フィルター適用時に、全体進捗率が正しく計算されること

### 検証方法

```bash
# shadcn/ui Switch導入
pnpm dlx shadcn-ui@latest add switch

# 開発サーバー起動
pnpm dev

# ブラウザでアクセス
# http://localhost:3000

# トグルスイッチをON/OFF
# ローカルストレージに`show_incomplete_only`が保存されることを確認
# DevTools > Application > Local Storage
```

## 実装例

### /app/page.tsx（更新）

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserId } from '@/lib/user';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const FILTER_KEY = 'show_incomplete_only';

export default function HomePage() {
  const userId = getUserId();
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  // ローカルストレージからフィルター状態を復元
  useEffect(() => {
    const saved = localStorage.getItem(FILTER_KEY);
    if (saved !== null) {
      setShowIncompleteOnly(saved === 'true');
    }
  }, []);

  // フィルター状態をローカルストレージに保存
  const toggleFilter = (checked: boolean) => {
    setShowIncompleteOnly(checked);
    localStorage.setItem(FILTER_KEY, checked.toString());
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['progress', userId],
    queryFn: () => fetchProgress(userId),
    enabled: !!userId,
  });

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  const { summary, progress } = data || { summary: {}, progress: [] };

  // フィルタリング適用
  const filteredProgress = showIncompleteOnly
    ? progress.filter((p: any) => p.status === 'pending' || p.status === 'unresolved')
    : progress;

  // Day別進捗を計算
  const dayProgress = [1, 2, 3].map((day) => {
    const allItems = progress.filter((p: any) => p.checklistItem.day === day);
    const filteredItems = filteredProgress.filter((p: any) => p.checklistItem.day === day);
    const resolved = filteredItems.filter((p: any) => p.status === 'resolved').length;

    return {
      day,
      total: showIncompleteOnly ? filteredItems.length : allItems.length,
      resolved,
      percentage:
        filteredItems.length > 0
          ? Math.round((resolved / filteredItems.length) * 100)
          : 0,
    };
  });

  // 全体進捗率（フィルター適用時は未完了項目のみで計算）
  const totalItems = showIncompleteOnly ? filteredProgress.length : summary.total;
  const resolvedItems = showIncompleteOnly
    ? filteredProgress.filter((p: any) => p.status === 'resolved').length
    : summary.resolved;
  const overallPercentage =
    totalItems > 0 ? Math.round((resolvedItems / totalItems) * 100) : 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ITオンボーディング</h1>

      {/* フィルタートグル */}
      <div className="flex items-center gap-2 mb-6">
        <Switch
          id="filter-incomplete"
          checked={showIncompleteOnly}
          onCheckedChange={toggleFilter}
        />
        <Label htmlFor="filter-incomplete">未完了のみ表示</Label>
      </div>

      {/* 全体進捗 */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">
          {showIncompleteOnly ? '未完了項目の進捗' : '全体の進捗'}: {overallPercentage}% (
          {resolvedItems}/{totalItems})
        </p>
        <Progress value={overallPercentage} />
      </div>

      {/* Day別カード */}
      <div className="grid gap-4 md:grid-cols-3">
        {dayProgress.map(({ day, total, resolved, percentage }) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle>
                Day{day} {getDayTitle(day)}
              </CardTitle>
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

      {/* フィルター適用時のメッセージ */}
      {showIncompleteOnly && filteredProgress.length === 0 && (
        <div className="text-center mt-8 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800 font-semibold">🎉 すべて完了しました！</p>
        </div>
      )}
    </div>
  );
}
```

## フィルタリングロジック

### 未完了項目の定義

- `status === 'pending'`: 未着手
- `status === 'unresolved'`: 未解決

### 完了項目の定義

- `status === 'resolved'`: 解決済み

## 要確認事項

- shadcn/ui SwitchコンポーネントとLabelコンポーネントはインストール済みか？
  - Switch: `pnpm dlx shadcn-ui@latest add switch`
  - Label: `pnpm dlx shadcn-ui@latest add label`
- デフォルトでフィルターをONにするか、OFFにするか？（現状: OFF）
