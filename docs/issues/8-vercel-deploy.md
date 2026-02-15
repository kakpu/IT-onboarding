# Issue #8: Vercelデプロイ設定

## 背景 / 目的

Vercelにプロジェクトをデプロイし、本番環境で動作確認する。これにより、Phase 1（Walking Skeleton）が完成し、エンドツーエンドで動作する最小限のアプリケーションが公開される。

- **依存**: #7
- **ラベル**: infrastructure, deployment

## スコープ / 作業項目

1. GitHubリポジトリ作成・コードpush
2. Vercelプロジェクト作成・GitHubリポジトリ連携
3. Vercel環境変数設定（Supabase URL/KEY）
4. 初回デプロイ
5. 本番環境で動作確認
6. プレビューデプロイ機能確認

## ゴール / 完了条件（Acceptance Criteria）

- [ ] GitHubリポジトリ作成、コードpush完了
- [ ] Vercelプロジェクト作成、GitHubリポジトリ連携完了
- [ ] Vercel環境変数設定（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
- [ ] 初回デプロイ成功、本番URLアクセス確認
- [ ] 本番環境で名前入力→Day1ページ→進捗更新の動作確認
- [ ] プレビューデプロイ機能確認（PRごとに自動デプロイ）

## テスト観点

- **デプロイ成功**: Vercelダッシュボードでデプロイステータスが「Ready」になること
- **本番環境動作確認**: 本番URLにアクセスし、名前入力→Day1ページ→進捗更新が正常に動作すること
- **環境変数確認**: 本番環境でSupabaseに接続できること（API呼び出しが成功すること）
- **プレビューデプロイ**: GitHubでPRを作成し、Vercelが自動的にプレビューURLを生成すること

### 検証方法

```bash
# GitHubリポジトリ作成（GitHub CLI使用）
gh repo create it-onboarding --public --source=. --remote=origin
git add .
git commit -m "feat: Phase 1 Walking Skeleton完成"
git push -u origin main

# Vercelにログイン
pnpm add -g vercel
vercel login

# Vercelプロジェクト作成
vercel

# 環境変数設定（Vercelダッシュボードで設定、またはCLIで設定）
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# 再デプロイ
vercel --prod

# 本番URLにアクセスして動作確認
# https://it-onboarding.vercel.app
```

## 実装手順

### 1. GitHubリポジトリ作成

1. GitHubで新規リポジトリ作成（`it-onboarding`）
2. ローカルリポジトリをGitHubにpush

```bash
git init
git add .
git commit -m "feat: Phase 1 Walking Skeleton完成"
git branch -M main
git remote add origin https://github.com/{YOUR_USERNAME}/it-onboarding.git
git push -u origin main
```

### 2. Vercelプロジェクト作成

1. [Vercel](https://vercel.com/)にアクセス
2. 「New Project」をクリック
3. GitHubリポジトリ（`it-onboarding`）を選択
4. Framework Preset: Next.js（自動検出）
5. Root Directory: `.`（デフォルト）
6. Build Command: `pnpm build`（自動検出）
7. Install Command: `pnpm install`（自動検出）
8. 「Deploy」をクリック

### 3. 環境変数設定

1. Vercelダッシュボード > Settings > Environment Variables
2. 以下の環境変数を追加:
   - `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase ANON KEY
3. Environment: Production, Preview, Development すべてにチェック
4. 「Save」をクリック
5. Deploymentsタブから最新のデプロイを「Redeploy」

### 4. 本番環境動作確認

1. Vercelが提供する本番URL（例: `https://it-onboarding.vercel.app`）にアクセス
2. 名前入力ダイアログが表示されることを確認
3. 名前を入力して「次へ」をクリック
4. トップページが表示されることを確認
5. 「Day1 初期設定」カードをクリック
6. Day1ページが表示され、チェックリスト項目が1件表示されることを確認
7. 「解決した」ボタンをクリック
8. Supabase管理画面で`user_progress`テーブルに新規レコードが作成されることを確認

### 5. プレビューデプロイ確認

1. GitHubで新しいブランチを作成（例: `feature/test-preview`）
2. 適当な変更をコミット・push
3. GitHubでPRを作成
4. Vercel botがコメントを投稿し、プレビューURLが生成されることを確認
5. プレビューURLにアクセスし、変更内容が反映されていることを確認

## カスタムドメイン設定（オプション）

本番環境で独自ドメインを使用する場合:

1. Vercelダッシュボード > Settings > Domains
2. カスタムドメインを追加
3. DNSレコードを設定（VercelがCNAMEレコードを提供）
4. SSL証明書が自動発行されることを確認

## 要確認事項

- Vercelの無料枠（Hobby）で十分か？（推奨: Phase 1-2は無料枠で十分）
- カスタムドメインは必要か？（オプション）
