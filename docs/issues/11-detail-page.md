# Issue #11: 詳細ページ実装

## 背景 / 目的

`/checklist/:id`ページを作成し、手順・注意点を詳細に表示する。これにより、ユーザーが各項目の具体的な作業手順を確認できる。

- **依存**: #10
- **ラベル**: frontend, api

## スコープ / 作業項目

1. `/app/checklist/[id]/page.tsx`作成
2. `/app/api/checklist-items/[id]/route.ts`作成（GET /api/checklist-items/:id）
3. パンくずリスト表示
4. 概要・手順・注意点セクション表示
5. 手順リストにローカル状態のチェックボックス追加
6. 戻るボタン実装

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/checklist/[id]/page.tsx`作成、詳細ページ実装完了
- [ ] `/app/api/checklist-items/[id]/route.ts`作成（GET /api/checklist-items/:id）
- [ ] パンくずリスト表示（ホーム > DayN > 項目名）
- [ ] 概要（summary）、手順（steps）、注意点（notes）セクション表示
- [ ] 手順リストにローカル状態のチェックボックス追加（チェック状態はローカルストレージに保存）
- [ ] 戻るボタンでDay一覧ページへ遷移

## テスト観点

- **詳細ページ表示**: `/checklist/:id`にアクセスし、項目の詳細が表示されること
- **API動作確認**: `GET /api/checklist-items/:id`で項目の詳細が返却されること
- **パンくずリスト**: 正しいパンくずリストが表示されること
- **手順チェックボックス**: 手順のチェックボックスをクリックすると、ローカルストレージに保存されること
- **戻るボタン**: 戻るボタンをクリックすると、Day一覧ページに遷移すること

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# API動作確認
curl http://localhost:3000/api/checklist-items/{CHECKLIST_ITEM_ID}

# ブラウザでアクセス
# http://localhost:3000/checklist/{CHECKLIST_ITEM_ID}
```

## 実装例（docs/04_api.md, docs/05_sitemap.md参照）

### /app/api/checklist-items/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Checklist item not found',
            },
          },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      id: data.id,
      day: data.day,
      category: data.category,
      title: data.title,
      summary: data.summary,
      steps: data.steps,
      notes: data.notes,
      orderIndex: data.order_index,
    });
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

### /app/checklist/[id]/page.tsx

```typescript
import { ChecklistDetail } from '@/components/checklist-detail';
import { notFound } from 'next/navigation';

async function getChecklistItem(id: string) {
  const res = await fetch(`http://localhost:3000/api/checklist-items/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ChecklistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await getChecklistItem(params.id);

  if (!item) {
    notFound();
  }

  return <ChecklistDetail item={item} />;
}
```

### /components/checklist-detail.tsx

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';

export function ChecklistDetail({ item }: { item: any }) {
  const router = useRouter();
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>([]);

  useEffect(() => {
    // ローカルストレージからチェック状態を復元
    const saved = localStorage.getItem(`checklist-${item.id}-steps`);
    if (saved) {
      setCheckedSteps(JSON.parse(saved));
    } else {
      setCheckedSteps(new Array(item.steps.length).fill(false));
    }
  }, [item.id, item.steps.length]);

  const toggleStep = (index: number) => {
    const newCheckedSteps = [...checkedSteps];
    newCheckedSteps[index] = !newCheckedSteps[index];
    setCheckedSteps(newCheckedSteps);
    localStorage.setItem(`checklist-${item.id}-steps`, JSON.stringify(newCheckedSteps));
  };

  return (
    <div className="container mx-auto p-4">
      <nav className="text-sm text-gray-600 mb-4">
        <a href="/" className="hover:underline">ホーム</a> &gt;{' '}
        <a href={`/day/${item.day}`} className="hover:underline">Day{item.day}</a> &gt;{' '}
        {item.title}
      </nav>

      <h1 className="text-2xl font-bold mb-4">{item.title}</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">概要</h2>
        <p>{item.summary}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">手順</h2>
        <div className="space-y-2">
          {item.steps.map((step: string, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <Checkbox
                checked={checkedSteps[index] || false}
                onCheckedChange={() => toggleStep(index)}
              />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      {item.notes && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">注意点</h2>
          <p className="text-sm text-orange-600">{item.notes}</p>
        </section>
      )}

      <Button onClick={() => router.back()}>← 戻る</Button>
    </div>
  );
}
```

## 要確認事項

- shadcn/ui Checkboxコンポーネントはインストール済みか？（未インストールの場合: `pnpm dlx shadcn-ui@latest add checkbox`）
