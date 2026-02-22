# Issue #3: Supabaseクライアント設定

## 背景 / 目的

Next.jsアプリケーションからSupabaseに接続するためのクライアントライブラリを導入し、クライアントサイド・サーバーサイドの両方で使用できるヘルパー関数を作成する。

- **依存**: #2
- **ラベル**: backend, infrastructure

## スコープ / 作業項目

1. `@supabase/supabase-js`パッケージ導入
2. 環境変数設定（`.env.local`）
3. クライアントサイド用Supabaseクライアント作成（`/lib/supabase/client.ts`）
4. サーバーサイド用Supabaseクライアント作成（`/lib/supabase/server.ts`）
5. 接続テスト（`checklist_items`テーブルからデータ取得）

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `@supabase/supabase-js`パッケージ導入完了
- [ ] `.env.local`にSupabase環境変数設定（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
- [ ] `/lib/supabase/client.ts`作成（クライアントサイド用Supabaseクライアント）
- [ ] `/lib/supabase/server.ts`作成（サーバーサイド用Supabaseクライアント）
- [ ] シンプルなクエリテスト（`checklist_items`テーブルからデータ取得）が成功
- [ ] `.env.local`を`.gitignore`に追加し、`.env.example`を作成

## テスト観点

- **クライアントサイド接続確認**: ブラウザのコンソールでSupabaseクライアントが正常に動作すること
- **サーバーサイド接続確認**: API RouteでSupabaseクライアントが正常に動作すること
- **クエリ実行確認**: `checklist_items`テーブルから1件以上のデータが取得できること

### 検証方法

```bash
# パッケージ導入
pnpm add @supabase/supabase-js

# テスト用API Route作成
# app/api/test/route.ts
```

```typescript
// app/api/test/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from('checklist_items').select('*').limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

```bash
# テスト実行
curl http://localhost:3000/api/test
```

## 実装例（docs/02_architecture.md参照）

### /lib/supabase/client.ts

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### /lib/supabase/server.ts

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

## 要確認事項

- Supabase環境変数は`.env.local`に保存するが、チーム開発時の共有方法は？（推奨: 1Password等でシークレット管理）
