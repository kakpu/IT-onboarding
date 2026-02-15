# Issue #2: Supabaseプロジェクト作成とDB初期化

## 背景 / 目的

Supabaseプロジェクトを作成し、4つのテーブル（users, checklist_items, user_progress, activity_logs）を定義する。DDLをマイグレーションファイルとして管理し、バージョン管理可能な状態にする。

- **依存**: #1
- **ラベル**: backend, database

## スコープ / 作業項目

1. Supabaseプロジェクト作成（Web UI）
2. プロジェクトURL・ANON KEYの取得
3. ローカルSupabase CLI導入
4. `supabase/migrations/`にDDL SQLファイル作成
5. 4テーブル作成（users, checklist_items, user_progress, activity_logs）
6. インデックス作成
7. Day1の1項目のみサンプルデータ投入

## ゴール / 完了条件（Acceptance Criteria）

- [ ] Supabaseプロジェクト作成、プロジェクトURLとANON KEYを取得完了
- [ ] `supabase/migrations/`にDDL SQLファイル作成（4テーブル + インデックス）
- [ ] ローカルSupabase CLI導入（`pnpm add -D supabase`）、`supabase init`実行完了
- [ ] `supabase db push`でマイグレーション実行、テーブル作成確認
- [ ] Day1の1項目のみのサンプルデータを`seed.sql`で投入（Windowsログイン）
- [ ] Supabase管理画面でテーブル・データ確認完了

## テスト観点

- **テーブル存在確認**: Supabase管理画面でusers, checklist_items, user_progress, activity_logsテーブルが存在すること
- **インデックス確認**: 各テーブルに適切なインデックスが作成されていること
- **サンプルデータ確認**: checklist_itemsテーブルにDay1の1項目（Windowsログイン）が存在すること
- **マイグレーション確認**: `supabase/migrations/`にSQLファイルが存在し、`supabase db reset`で再現可能なこと

### 検証方法

```bash
# Supabase CLI導入
pnpm add -D supabase

# Supabase初期化
pnpm exec supabase init

# ローカルSupabase起動（Dockerが必要）
pnpm exec supabase start

# マイグレーション作成
pnpm exec supabase migration new create_tables

# マイグレーション実行
pnpm exec supabase db push

# Supabase管理画面でテーブル確認
# http://localhost:54323
```

## DDL参考（docs/03_database.md参照）

```sql
-- users テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  entra_id VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  department VARCHAR(100),
  join_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- checklist_items テーブル
-- user_progress テーブル
-- activity_logs テーブル
-- （詳細はdocs/03_database.md参照）
```

## 要確認事項

- Supabaseプロジェクトのリージョンは`Northeast Asia (Tokyo)`で良いか？
- ローカル開発時はSupabase Local Development（Docker）を使用するか、リモートのSupabaseプロジェクトを直接使用するか？
