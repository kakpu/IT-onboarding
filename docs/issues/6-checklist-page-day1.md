# Issue #6: チェックリスト一覧ページ（Day1、1項目のみ）

## 背景 / 目的

`/day/1`ページを作成し、API RouteからDay1のチェックリスト項目（1項目）を取得・表示する。これにより、垂直スライス（UI → API → DB）が完成し、基本的なデータフローを確認できる。

- **依存**: #3, #4, #5
- **ラベル**: frontend, backend, api

## スコープ / 作業項目

1. `/app/day/1/page.tsx`作成（Day1チェックリストページ）
2. `/app/api/checklist-items/route.ts`作成（GET /api/checklist-items）
3. Zodでクエリパラメータバリデーション
4. Supabaseから`checklist_items`取得
5. チェックリストカードコンポーネント作成
6. 1項目表示確認

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/day/1/page.tsx`作成、Day1チェックリストページ実装完了
- [ ] `/app/api/checklist-items/route.ts`作成（GET /api/checklist-items）、Zodでバリデーション実装
- [ ] Supabaseから`checklist_items`取得、`day=1`でフィルタリング成功
- [ ] チェックリストカードコンポーネント作成、1項目（Windowsログイン）表示確認
- [ ] 認証チェックなし（誰でもアクセス可能）
- [ ] パンくずリスト表示（ホーム > Day1）

## テスト観点

- **API動作確認**: `GET /api/checklist-items?day=1`でDay1の1項目が返却されること
- **バリデーション確認**: `GET /api/checklist-items?day=invalid`で400エラーが返却されること
- **UI表示確認**: `/day/1`ページでチェックリスト項目が1件表示されること
- **レスポンシブ確認**: モバイル・タブレット・デスクトップで表示崩れがないこと

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# API動作確認
curl http://localhost:3000/api/checklist-items?day=1

# ブラウザでアクセス
# http://localhost:3000/day/1
```

## 実装例（docs/04_api.md参照）

### /app/api/checklist-items/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const querySchema = z.object({
  day: z.enum(['1', '2', '3']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.safeParse({
      day: searchParams.get('day'),
    });

    if (!query.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: query.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let dbQuery = supabase
      .from('checklist_items')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (query.data.day) {
      dbQuery = dbQuery.eq('day', parseInt(query.data.day));
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw error;
    }

    const items = data.map((item) => ({
      id: item.id,
      day: item.day,
      category: item.category,
      title: item.title,
      summary: item.summary,
      steps: item.steps,
      notes: item.notes,
      orderIndex: item.order_index,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
```

### /app/day/1/page.tsx

```typescript
import { ChecklistCard } from '@/components/checklist-card';

async function getChecklistItems(day: number) {
  const res = await fetch(`http://localhost:3000/api/checklist-items?day=${day}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default async function Day1Page() {
  const { items } = await getChecklistItems(1);

  return (
    <div className="container mx-auto p-4">
      <nav className="text-sm text-gray-600 mb-4">
        <a href="/" className="hover:underline">ホーム</a> &gt; Day1
      </nav>
      <h1 className="text-2xl font-bold mb-4">Day1 初期設定</h1>
      <div className="space-y-4">
        {items.map((item: any) => (
          <ChecklistCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
```

### /components/checklist-card.tsx

```typescript
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function ChecklistCard({ item }: { item: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.summary}</CardDescription>
      </CardHeader>
    </Card>
  );
}
```

## 要確認事項

- Zodパッケージはインストール済みか？（未インストールの場合: `pnpm add zod`）
