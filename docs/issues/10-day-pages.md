# Issue #10: Day別一覧表示（Day1-3）

## 背景 / 目的

Day2, Day3ページを作成し、Dayごとのチェックリスト項目を表示する。これにより、Day1-3すべてのページが揃い、MVP完成に向けた基盤が整う。

- **依存**: #9
- **ラベル**: frontend, api

## スコープ / 作業項目

1. `/app/day/2/page.tsx`作成
2. `/app/day/3/page.tsx`作成
3. 各ページで`/api/checklist-items?day=N`を呼び出し
4. Day別に複数項目表示
5. 進捗バー表示（完了数/全体数）
6. パンくずリスト追加

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/day/2/page.tsx`作成、Day2チェックリスト表示
- [ ] `/app/day/3/page.tsx`作成、Day3チェックリスト表示
- [ ] 各ページで`/api/checklist-items?day=N`を呼び出し、データ取得成功
- [ ] Day別に複数項目表示確認（Day1: 4項目, Day2: 6項目, Day3: 5項目）
- [ ] 進捗バー表示（完了数/全体数）※静的な表示でOK、後のIssueで動的に更新
- [ ] パンくずリスト追加（ホーム > DayN）

## テスト観点

- **Day2ページ表示**: `/day/2`にアクセスし、6項目が表示されること
- **Day3ページ表示**: `/day/3`にアクセスし、5項目が表示されること
- **パンくずリスト**: 各ページに「ホーム > DayN」のパンくずリストが表示されること
- **進捗バー**: 進捗バーが表示されること（静的な表示でOK）
- **レスポンシブ**: モバイル・タブレット・デスクトップで表示崩れがないこと

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# ブラウザでアクセス
# http://localhost:3000/day/1 → 4項目表示
# http://localhost:3000/day/2 → 6項目表示
# http://localhost:3000/day/3 → 5項目表示
```

## 実装例

### /app/day/2/page.tsx

```typescript
import { ChecklistCard } from '@/components/checklist-card';
import { Progress } from '@/components/ui/progress';

async function getChecklistItems(day: number) {
  const res = await fetch(`http://localhost:3000/api/checklist-items?day=${day}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default async function Day2Page() {
  const { items } = await getChecklistItems(2);
  const progress = 0; // 静的な値、後で動的に更新

  return (
    <div className="container mx-auto p-4">
      <nav className="text-sm text-gray-600 mb-4">
        <a href="/" className="hover:underline">ホーム</a> &gt; Day2
      </nav>
      <h1 className="text-2xl font-bold mb-4">Day2 ポータル・ツール設定</h1>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">進捗: {progress}% (0/{items.length})</p>
        <Progress value={progress} />
      </div>
      <div className="space-y-4">
        {items.map((item: any) => (
          <ChecklistCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
```

### /app/day/3/page.tsx

Day2と同様の構成、タイトルを「Day3 トラブル対応」に変更

## 進捗バー表示について

- 現時点では静的な表示（progress = 0）でOK
- Issue #12で進捗取得APIを実装後、動的に更新する

## 要確認事項

- shadcn/ui Progressコンポーネントはインストール済みか？（未インストールの場合: `pnpm dlx shadcn-ui@latest add progress`）
