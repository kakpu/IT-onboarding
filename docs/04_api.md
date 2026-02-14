# API設計

## 方針
- RESTful設計
- Next.js App Router のRoute Handlers (`/app/api/...route.ts`)
- NextAuth.jsで認証（JWTトークン検証）
- Zodでバリデーション
- エラーレスポンスは統一フォーマット

## エラーレスポンス統一フォーマット
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "day",
        "message": "day must be 1, 2, or 3"
      }
    ]
  }
}
```

## エラーコード一覧
- `UNAUTHORIZED` (401): 認証エラー
- `FORBIDDEN` (403): 権限エラー
- `NOT_FOUND` (404): リソースが見つからない
- `VALIDATION_ERROR` (400): バリデーションエラー
- `INTERNAL_SERVER_ERROR` (500): サーバーエラー

---

## 認証関連

### POST /api/auth/[...nextauth]
**認証**: 不要（NextAuth.jsエンドポイント）
**説明**: NextAuth.jsが自動処理（Entra ID OAuth 2.0フロー）

詳細はNextAuth.js公式ドキュメント参照。

---

## チェックリスト関連

### GET /api/checklist-items
**認証**: 必要（ログイン済みユーザー）
**説明**: チェックリスト項目一覧を取得

**クエリパラメータ**:
- `day` (optional): 1, 2, 3（特定のDayのみ取得）

**リクエスト例**:
```bash
curl -X GET "https://example.com/api/checklist-items?day=1" \
  -H "Authorization: Bearer <token>"
```

**レスポンス例** (200 OK):
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "day": 1,
      "category": "login",
      "title": "Windowsログイン",
      "summary": "Windows PCに初回ログインする",
      "steps": [
        "1. PCの電源を入れる",
        "2. Ctrl + Alt + Del を押す",
        "3. 配布されたユーザーID・パスワードを入力",
        "4. 言語設定を日本語に変更"
      ],
      "notes": "パスワードは初回ログイン後に変更してください",
      "orderIndex": 1
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "day": 1,
      "category": "m365",
      "title": "Microsoft 365 初期設定",
      "summary": "M365アカウントにログインし、基本設定を完了する",
      "steps": [
        "1. ブラウザでoffice.comにアクセス",
        "2. 配布されたメールアドレスでログイン",
        "3. 多要素認証（MFA）を設定",
        "4. OneDriveの同期設定"
      ],
      "notes": "MFAは必ず設定してください（セキュリティポリシー）",
      "orderIndex": 2
    }
  ]
}
```

**エラー**:
- `401 UNAUTHORIZED`: 認証エラー
- `400 VALIDATION_ERROR`: dayパラメータが不正

---

### GET /api/checklist-items/:id
**認証**: 必要
**説明**: 特定のチェックリスト項目の詳細を取得

**リクエスト例**:
```bash
curl -X GET "https://example.com/api/checklist-items/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

**レスポンス例** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "day": 1,
  "category": "login",
  "title": "Windowsログイン",
  "summary": "Windows PCに初回ログインする",
  "steps": [
    "1. PCの電源を入れる",
    "2. Ctrl + Alt + Del を押す",
    "3. 配布されたユーザーID・パスワードを入力",
    "4. 言語設定を日本語に変更"
  ],
  "notes": "パスワードは初回ログイン後に変更してください",
  "orderIndex": 1
}
```

**エラー**:
- `404 NOT_FOUND`: 項目が存在しない

---

## 進捗管理関連

### GET /api/progress
**認証**: 必要
**説明**: ログイン中のユーザーの進捗状態を取得

**クエリパラメータ**:
- `status` (optional): `pending`, `resolved`, `unresolved`（特定のステータスのみ取得）

**リクエスト例**:
```bash
curl -X GET "https://example.com/api/progress?status=pending" \
  -H "Authorization: Bearer <token>"
```

**レスポンス例** (200 OK):
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
      "id": "660e8400-e29b-41d4-a716-446655440001",
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

**エラー**:
- `401 UNAUTHORIZED`: 認証エラー

---

### PUT /api/progress/:checklistItemId
**認証**: 必要
**説明**: 特定のチェックリスト項目の進捗状態を更新

**リクエストボディ**:
```json
{
  "status": "resolved",
  "notes": "問題なく完了しました"
}
```

**リクエスト例**:
```bash
curl -X PUT "https://example.com/api/progress/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "notes": "問題なく完了しました"
  }'
```

**レスポンス例** (200 OK):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "checklistItemId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "resolved",
  "resolvedAt": "2024-02-14T12:00:00Z",
  "notes": "問題なく完了しました"
}
```

**エラー**:
- `400 VALIDATION_ERROR`: statusが不正（`pending`, `resolved`, `unresolved`以外）
- `404 NOT_FOUND`: チェックリスト項目が存在しない

---

## ログ記録関連

### POST /api/logs
**認証**: 必要
**説明**: ユーザーの行動ログを記録

**リクエストボディ**:
```json
{
  "checklistItemId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "view",
  "metadata": {
    "source": "day1_page"
  }
}
```

**actionの種類**:
- `view`: 項目を閲覧
- `resolve`: 解決マークした
- `unresolve`: 未解決マークした
- `contact_click`: 問い合わせボタンクリック
- `share_link`: リンク共有ボタンクリック

**リクエスト例**:
```bash
curl -X POST "https://example.com/api/logs" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "checklistItemId": "550e8400-e29b-41d4-a716-446655440000",
    "action": "view",
    "metadata": {
      "source": "day1_page"
    }
  }'
```

**レスポンス例** (201 Created):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "userId": "880e8400-e29b-41d4-a716-446655440000",
  "checklistItemId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "view",
  "metadata": {
    "source": "day1_page"
  },
  "createdAt": "2024-02-14T12:00:00Z"
}
```

**エラー**:
- `400 VALIDATION_ERROR`: actionが不正
- `404 NOT_FOUND`: checklistItemIdが存在しない

---

## 統計・管理者向けAPI（将来機能）

### GET /api/admin/stats
**認証**: 必要（管理者ロールのみ）
**説明**: 全体の統計情報を取得

**クエリパラメータ**:
- `startDate` (optional): 開始日（YYYY-MM-DD）
- `endDate` (optional): 終了日（YYYY-MM-DD）

**リクエスト例**:
```bash
curl -X GET "https://example.com/api/admin/stats?startDate=2024-02-01&endDate=2024-02-28" \
  -H "Authorization: Bearer <token>"
```

**レスポンス例** (200 OK):
```json
{
  "totalUsers": 50,
  "activeUsers": 35,
  "completionRate": 0.75,
  "topUnresolvedItems": [
    {
      "checklistItemId": "550e8400-e29b-41d4-a716-446655440005",
      "title": "VPN設定",
      "unresolvedCount": 12
    },
    {
      "checklistItemId": "550e8400-e29b-41d4-a716-446655440008",
      "title": "プリンタ設定",
      "unresolvedCount": 8
    }
  ],
  "mostViewedItems": [
    {
      "checklistItemId": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Microsoft 365 初期設定",
      "viewCount": 45
    }
  ]
}
```

**エラー**:
- `403 FORBIDDEN`: 管理者権限がない

---

## 実装例（Next.js Route Handler）

### /app/api/checklist-items/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const querySchema = z.object({
  day: z.enum(['1', '2', '3']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // クエリパラメータのバリデーション
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

    // Supabaseクエリ
    const supabase = createClient();
    let dbQuery = supabase
      .from('checklist_items')
      .select('*')
      .eq('is_active', true)
      .order('day', { ascending: true })
      .order('order_index', { ascending: true });

    if (query.data.day) {
      dbQuery = dbQuery.eq('day', parseInt(query.data.day));
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw error;
    }

    // レスポンス整形
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

## レート制限（将来）
- Vercel Edge Middleware + Upstash Redis
- ユーザーごと: 100リクエスト/分
- IP制限: 1000リクエスト/分
