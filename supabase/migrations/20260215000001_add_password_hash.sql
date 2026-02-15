-- NextAuth.js Credentials Provider 対応
-- password_hash カラムを users テーブルに追加

-- パスワードハッシュカラムを追加（既存ユーザーはNULL許容）
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- entra_id の NOT NULL 制約を解除（パスワード認証ユーザーは entra_id 不要）
ALTER TABLE users ALTER COLUMN entra_id DROP NOT NULL;
