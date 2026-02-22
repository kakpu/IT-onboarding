# Issue #7: 進捗更新機能（1項目のみ）

## 背景 / 目的

チェックリスト項目に「解決した」「解決しなかった」ボタンを追加し、進捗状態を更新できるようにする。これにより、ユーザーが完了状態を記録でき、進捗管理が可能になる。

- **依存**: #6
- **ラベル**: frontend, backend, api

## スコープ / 作業項目

1. `/app/api/progress/[checklistItemId]/route.ts`作成（PUT /api/progress/:checklistItemId）
2. Zodでリクエストボディバリデーション
3. `user_progress`テーブルにUPSERT実装
4. チェックリストカードに「解決した」「解決しなかった」ボタン追加
5. React Queryでキャッシュ更新・UI即時反映

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/api/progress/[checklistItemId]/route.ts`作成（PUT /api/progress/:checklistItemId）
- [ ] Zodでリクエストボディバリデーション（`status`, `notes`, `userId`）実装
- [ ] `user_progress`テーブルにINSERT/UPDATE（UPSERT）実装完了
- [ ] チェックリストカードに「解決した」「解決しなかった」ボタン追加
- [ ] ボタンクリックでAPI呼び出し、進捗更新成功確認
- [ ] React Queryでキャッシュ更新、UI即時反映（ボタンクリック後にステータス表示が変わる）

## テスト観点

- **API動作確認**: `PUT /api/progress/:checklistItemId`で進捗更新が成功すること
- **UPSERT確認**: 同じユーザー・項目の組み合わせで2回更新すると、UPDATEされること（重複レコードが作成されないこと）
- **バリデーション確認**: `status`が不正な値の場合、400エラーが返却されること
- **UI即時反映**: ボタンクリック後、ページリロードなしでステータス表示が更新されること

### 検証方法

```bash
# React Query導入
pnpm add @tanstack/react-query

# 開発サーバー起動
pnpm dev

# API動作確認
curl -X PUT http://localhost:3000/api/progress/{CHECKLIST_ITEM_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "userId": "{USER_ID}"}'

# ブラウザでアクセス
# http://localhost:3000/day/1
# 「解決した」ボタンをクリック
# Supabase管理画面でuser_progressテーブルに新規レコードが作成されることを確認
```

## 実装例（docs/04_api.md参照）

### /app/api/progress/[checklistItemId]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  status: z.enum(['pending', 'resolved', 'unresolved']),
  notes: z.string().optional(),
  userId: z.string().uuid(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { checklistItemId: string } }
) {
  try {
    const body = await request.json();
    const result = bodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: result.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { status, notes, userId } = result.data;
    const { checklistItemId } = params;

    const supabase = createClient();

    // UPSERT: user_id + checklist_item_id がユニークキー
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        checklist_item_id: checklistItemId,
        status,
        notes,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      id: data.id,
      checklistItemId: data.checklist_item_id,
      status: data.status,
      resolvedAt: data.resolved_at,
      notes: data.notes,
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

### /components/checklist-card.tsx（更新）

```typescript
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserId } from '@/lib/user';

export function ChecklistCard({ item }: { item: any }) {
  const queryClient = useQueryClient();

  const updateProgress = useMutation({
    mutationFn: async (status: 'resolved' | 'unresolved') => {
      const res = await fetch(`/api/progress/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId: getUserId() }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.summary}</CardDescription>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button
          variant="default"
          onClick={() => updateProgress.mutate('resolved')}
          disabled={updateProgress.isPending}
        >
          ✓ 解決した
        </Button>
        <Button
          variant="destructive"
          onClick={() => updateProgress.mutate('unresolved')}
          disabled={updateProgress.isPending}
        >
          ✗ 解決しなかった
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## 要確認事項

- React Queryのセットアップ（`QueryClientProvider`の配置）は別途必要。`/app/providers.tsx`を作成し、`layout.tsx`でラップする。
