# Issue #12: 進捗取得API実装

## 背景 / 目的

ユーザーの進捗状態を取得するAPIを実装する。これにより、トップページやDay一覧ページで進捗率を動的に表示できる。

- **依存**: #10
- **ラベル**: backend, api

## スコープ / 作業項目

1. `/app/api/progress/route.ts`作成（GET /api/progress）
2. クエリパラメータで`userId`を受け取り、進捗データ取得
3. クエリパラメータで`status`フィルタリング対応
4. レスポンスに`checklist_item`情報をJOIN
5. サマリー集計（total, resolved, unresolved, pending）
6. Zodでバリデーション実装

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/api/progress/route.ts`作成（GET /api/progress）
- [ ] クエリパラメータで`userId`を受け取り、該当ユーザーの`user_progress`データを取得
- [ ] クエリパラメータで`status`フィルタリング対応（pending, resolved, unresolved）
- [ ] レスポンスに`checklist_item`情報をJOIN
- [ ] サマリー集計（total, resolved, unresolved, pending）を返す
- [ ] Zodでバリデーション、エラーハンドリング実装

## テスト観点

- **API動作確認**: `GET /api/progress?userId=XXX`でユーザーの進捗データが返却されること
- **フィルタリング確認**: `GET /api/progress?userId=XXX&status=resolved`で解決済み項目のみ返却されること
- **サマリー集計確認**: レスポンスに`summary`オブジェクトが含まれ、正しい集計値が返却されること
- **バリデーション確認**: `userId`が不正な場合、400エラーが返却されること

### 検証方法

```bash
# API動作確認
curl "http://localhost:3000/api/progress?userId={USER_ID}"

# フィルタリング確認
curl "http://localhost:3000/api/progress?userId={USER_ID}&status=resolved"
```

## 実装例（docs/04_api.md参照）

### /app/api/progress/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const querySchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['pending', 'resolved', 'unresolved']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.safeParse({
      userId: searchParams.get('userId'),
      status: searchParams.get('status'),
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

    const { userId, status } = query.data;

    const supabase = createClient();

    // 全チェックリスト項目を取得
    const { data: allItems, error: itemsError } = await supabase
      .from('checklist_items')
      .select('id, day, title, category')
      .eq('is_active', true)
      .order('day', { ascending: true })
      .order('order_index', { ascending: true });

    if (itemsError) throw itemsError;

    // ユーザーの進捗を取得
    let progressQuery = supabase.from('user_progress').select('*').eq('user_id', userId);

    if (status) {
      progressQuery = progressQuery.eq('status', status);
    }

    const { data: progressData, error: progressError } = await progressQuery;

    if (progressError) throw progressError;

    // 進捗データをマップに変換
    const progressMap = new Map(progressData.map((p) => [p.checklist_item_id, p]));

    // チェックリスト項目と進捗をマージ
    const progress = allItems.map((item) => {
      const userProgress = progressMap.get(item.id);
      return {
        id: userProgress?.id || null,
        checklistItemId: item.id,
        status: userProgress?.status || 'pending',
        resolvedAt: userProgress?.resolved_at || null,
        notes: userProgress?.notes || null,
        checklistItem: {
          id: item.id,
          day: item.day,
          title: item.title,
          category: item.category,
        },
      };
    });

    // サマリー集計
    const summary = {
      total: allItems.length,
      resolved: progress.filter((p) => p.status === 'resolved').length,
      unresolved: progress.filter((p) => p.status === 'unresolved').length,
      pending: progress.filter((p) => p.status === 'pending').length,
    };

    return NextResponse.json({ progress, summary });
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

## レスポンス例

```json
{
  "progress": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "checklistItemId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "resolved",
      "resolvedAt": "2024-02-14T10:30:00Z",
      "notes": null,
      "checklistItem": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "day": 1,
        "title": "Windowsログイン",
        "category": "login"
      }
    },
    {
      "id": null,
      "checklistItemId": "550e8400-e29b-41d4-a716-446655440001",
      "status": "pending",
      "resolvedAt": null,
      "notes": null,
      "checklistItem": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "day": 1,
        "title": "Microsoft 365 初期設定",
        "category": "m365"
      }
    }
  ],
  "summary": {
    "total": 15,
    "resolved": 5,
    "unresolved": 2,
    "pending": 8
  }
}
```

## 要確認事項

- 進捗データが存在しない項目は`status: "pending"`として返す仕様でよいか？
