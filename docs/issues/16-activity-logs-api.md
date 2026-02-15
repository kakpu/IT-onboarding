# Issue #16: 利用ログ記録API実装

## 背景 / 目的

ユーザーの行動ログを記録するAPIを実装する。これにより、どの項目がよく閲覧されているか、どの項目で問い合わせが多いかを分析できる。

- **依存**: #14, #15
- **ラベル**: backend, api

## スコープ / 作業項目

1. `/app/api/logs/route.ts`作成（POST /api/logs）
2. Zodでリクエストボディバリデーション
3. `activity_logs`テーブルにINSERT実装
4. actionの種類（view, resolve, unresolve, contact_click, share_link）を検証
5. エラーハンドリング実装

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/api/logs/route.ts`作成（POST /api/logs）
- [ ] Zodでリクエストボディバリデーション（`userId`, `checklistItemId`, `action`, `metadata`）
- [ ] `activity_logs`テーブルにINSERT実装完了
- [ ] actionの種類（view, resolve, unresolve, contact_click, share_link）を検証
- [ ] エラーハンドリング、統一フォーマットのエラーレスポンス実装

## テスト観点

- **API動作確認**: `POST /api/logs`でログが記録されること
- **バリデーション確認**: `action`が不正な値の場合、400エラーが返却されること
- **ログ保存確認**: `activity_logs`テーブルに新規レコードが作成されること
- **metadata保存確認**: JSONBフィールドに追加情報が正しく保存されること

### 検証方法

```bash
# API動作確認
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{USER_ID}",
    "checklistItemId": "{CHECKLIST_ITEM_ID}",
    "action": "view",
    "metadata": {"source": "day1_page"}
  }'

# Supabase管理画面でactivity_logsテーブル確認
```

## 実装例（docs/04_api.md参照）

### /app/api/logs/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  userId: z.string().uuid(),
  checklistItemId: z.string().uuid().optional(),
  action: z.enum(['view', 'resolve', 'unresolve', 'contact_click', 'share_link']),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
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

    const { userId, checklistItemId, action, metadata } = result.data;

    const supabase = createClient();

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        checklist_item_id: checklistItemId || null,
        action,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        id: data.id,
        userId: data.user_id,
        checklistItemId: data.checklist_item_id,
        action: data.action,
        metadata: data.metadata,
        createdAt: data.created_at,
      },
      { status: 201 }
    );
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

## actionの種類と用途

| action          | 用途                     | metadata例                    |
| --------------- | ------------------------ | ----------------------------- |
| `view`          | 項目を閲覧               | `{ "source": "day1_page" }`   |
| `resolve`       | 解決マークした           | `{ "duration_seconds": 300 }` |
| `unresolve`     | 未解決マークした         | `{ "reason": "error" }`       |
| `contact_click` | 問い合わせボタンクリック | `{ "method": "teams" }`       |
| `share_link`    | リンク共有ボタンクリック | `{ "url": "https://..." }`    |

## ログ記録タイミング

- **view**: 詳細ページを開いた時（`/checklist/:id`にアクセス時）
- **resolve/unresolve**: 進捗更新ボタンをクリックした時
- **contact_click**: 問い合わせボタンをクリックした時
- **share_link**: リンク共有ボタンをクリックした時

## 詳細ページでのview ログ記録例

### /components/checklist-detail.tsx（useEffect追加）

```typescript
'use client';

import { useEffect } from 'react';
import { getUserId } from '@/lib/user';

export function ChecklistDetail({ item }: { item: any }) {
  useEffect(() => {
    // ページ表示時にviewログ記録
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: getUserId(),
        checklistItemId: item.id,
        action: 'view',
        metadata: { source: 'detail_page' },
      }),
    });
  }, [item.id]);

  // ... 既存のコード ...
}
```

## 要確認事項

- ログ記録は非同期で良いか？（エラーが発生してもユーザーに影響しない）
- ログの保持期間は？（将来的にパーティショニングを検討）
