-- ITオンボーディングシステム - 初期テーブル作成
-- 作成日: 2026-02-15

-- ============================================
-- users テーブル: ユーザー情報
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  entra_id VARCHAR(255) UNIQUE NOT NULL, -- Entra ID (Azure AD) のユーザーID
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'trainer', 'admin'
  department VARCHAR(100),
  join_date DATE, -- 入社日
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- usersテーブルのインデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_entra_id ON users(entra_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- checklist_items テーブル: チェックリスト項目マスタ
-- ============================================
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INT NOT NULL, -- 1, 2, 3 (Day1-3)
  category VARCHAR(50) NOT NULL, -- 'login', 'm365', 'teams', 'iphone', 'vpn', etc.
  title VARCHAR(200) NOT NULL, -- 項目タイトル
  summary TEXT NOT NULL, -- 結論（概要）
  steps JSONB NOT NULL, -- 手順（配列形式）
  notes TEXT, -- 注意点
  order_index INT NOT NULL, -- 表示順序
  is_active BOOLEAN DEFAULT TRUE, -- 有効/無効
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- checklist_itemsテーブルのインデックス
CREATE INDEX idx_checklist_items_day ON checklist_items(day);
CREATE INDEX idx_checklist_items_category ON checklist_items(category);
CREATE INDEX idx_checklist_items_order ON checklist_items(day, order_index);

-- ============================================
-- user_progress テーブル: ユーザーごとのチェックリスト進捗状態
-- ============================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'unresolved'
  resolved_at TIMESTAMP WITH TIME ZONE, -- 解決した日時
  notes TEXT, -- ユーザーのメモ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, checklist_item_id) -- 同じユーザー・項目の組み合わせは1つだけ
);

-- user_progressテーブルのインデックス
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_user_progress_user_status ON user_progress(user_id, status);

-- ============================================
-- activity_logs テーブル: 利用ログ
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES checklist_items(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'view', 'resolve', 'unresolve', 'contact_click', 'share_link'
  metadata JSONB, -- 追加情報（どのリンクをクリックしたか等）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- activity_logsテーブルのインデックス
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_action ON activity_logs(user_id, action);
