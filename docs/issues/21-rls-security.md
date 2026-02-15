# Issue #21: Row Level Security (RLS) 設定

## 背景 / 目的

Supabaseで行レベルアクセス制御を実装し、セキュリティを強化する。認証機能を追加したので、ユーザーが自分のデータのみにアクセスできるようにする。

- **依存**: #20
- **ラベル**: backend, database, security

## スコープ / 作業項目

1. `users`テーブルにRLSポリシー設定
2. `user_progress`テーブルにRLSポリシー設定
3. `activity_logs`テーブルにRLSポリシー設定
4. `checklist_items`テーブルにRLSポリシー設定
5. RLS有効化後に各APIの動作確認
6. 他ユーザーのデータにアクセスできないことを確認

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `users`テーブルにRLSポリシー設定（自分の情報のみ閲覧・更新可能）
- [ ] `user_progress`テーブルにRLSポリシー設定（自分の進捗のみ閲覧・更新可能）
- [ ] `activity_logs`テーブルにRLSポリシー設定（自分のログのみ作成可能）
- [ ] `checklist_items`テーブルにRLSポリシー設定（全員が閲覧可能）
- [ ] RLS有効化後に各APIの動作確認（認証ユーザーのみアクセス可能）
- [ ] 他ユーザーのデータにアクセスできないことを確認

## テスト観点

- **RLS有効化確認**: 各テーブルでRLSが有効化されていること
- **ポリシー動作確認**: 自分のデータのみ閲覧・更新できること
- **他ユーザーデータ**: 他ユーザーのデータにアクセスできないこと
- **管理者権限**: 管理者は全データにアクセスできること（将来機能）

### 検証方法

```bash
# Supabase管理画面でRLS確認
# http://localhost:54323/project/default/auth/policies

# SQLでポリシー確認
SELECT * FROM pg_policies WHERE schemaname = 'public';

# 2人のユーザーでログインし、互いのデータにアクセスできないことを確認
```

## 実装例（docs/03_database.md参照）

### RLSポリシーSQL

#### /supabase/migrations/XXX_enable_rls.sql

```sql
-- users テーブル: 自分の情報のみ閲覧・更新可能
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- user_progress テーブル: 自分の進捗のみ閲覧・更新可能
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- activity_logs テーブル: 自分のログのみ作成可能
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own logs"
  ON activity_logs FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- checklist_items テーブル: 全員が閲覧可能
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view checklist items"
  ON checklist_items FOR SELECT
  TO authenticated
  USING (is_active = true);
```

## NextAuth.jsとSupabase RLSの連携

NextAuth.jsのセッションIDをSupabaseのRLSで使用するには、カスタム関数が必要です。

### /supabase/migrations/XXX_auth_functions.sql

```sql
-- NextAuth.jsセッションIDを取得する関数
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    (current_setting('request.jwt.claims', true)::json->>'user_id')
  )::uuid;
$$;
```

ただし、NextAuth.js v5ではSupabase RLSとの統合が複雑なため、以下の代替案を推奨：

### 代替案: API Routeでのアクセス制御

RLSの代わりに、API Route層でアクセス制御を実装する方が簡単です。

#### /app/api/progress/route.ts（更新）

```typescript
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // 認証チェック
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // ユーザー自身のデータのみ取得
  const supabase = createClient();
  const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId);

  // ...
}
```

## RLS vs API Route アクセス制御

| 方式          | メリット                                     | デメリット                |
| ------------- | -------------------------------------------- | ------------------------- |
| **RLS**       | データベースレベルで保護、万全のセキュリティ | NextAuth.jsとの統合が複雑 |
| **API Route** | 実装が簡単、NextAuth.jsと相性良い            | API層のみの保護           |

**推奨**: Phase 4ではAPI Route層でのアクセス制御を実装し、Phase 5でSupabase Auth（Entra ID統合）への移行時にRLSを有効化する。

## 簡易版RLS実装（認証ユーザーのみアクセス可能）

最小限のRLS設定:

```sql
-- 認証ユーザーのみアクセス可能
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access"
  ON users FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can access"
  ON checklist_items FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can access"
  ON user_progress FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can access"
  ON activity_logs FOR ALL
  TO authenticated
  USING (true);
```

この設定では、認証済みユーザーはすべてのデータにアクセスできますが、未認証ユーザーはアクセスできません。

## 要確認事項

- RLSの厳密な実装（ユーザーごとの行レベル制御）は必要か、それとも認証ユーザーのみアクセス可能で十分か？
- 推奨: Phase 4では簡易版RLS + API Route制御、Phase 5で厳密なRLSに移行
