# 実装計画

## フェーズ構成

| フェーズ名                    | 目的                                                                             | 含むIssue番号 |
| ----------------------------- | -------------------------------------------------------------------------------- | ------------- |
| **Phase 1: Walking Skeleton** | 最小限のエンドツーエンドを実装し、動作確認とデプロイ可能な状態を作る（認証なし） | #1〜#8        |
| **Phase 2: MVP完成**          | Day1-3のチェックリスト表示・進捗管理・問い合わせ導線の基本機能を完成させる       | #9〜#16       |
| **Phase 3: UI/UX改善**        | レスポンシブ対応、エラーハンドリング、フィルター機能でユーザー体験を向上         | #17〜#19      |
| **Phase 4: 認証・堅牢化**     | 簡易認証追加、セキュリティ強化、テスト追加、監視体制構築                         | #20〜#23      |
| **Phase 5: 将来機能**         | Entra ID統合、管理者向けダッシュボード・項目管理・ユーザー管理                   | #24〜#27      |

---

## 依存関係マップ

```
Phase 1: Walking Skeleton (認証なし)
  #1 (プロジェクトセットアップ)
    ├→ #2 (Supabase DB初期化)
    ├→ #4 (簡易ユーザー識別機能)
    └→ #5 (トップページ静的UI)

  #2 → #3 (Supabaseクライアント設定)

  #3, #4, #5 → #6 (チェックリスト一覧ページ)

  #6 → #7 (進捗更新機能)

  #7 → #8 (Vercelデプロイ)

Phase 2: MVP完成
  #8 → #9 (チェックリスト項目マスタデータ投入)

  #9 → #10 (Day別一覧表示)

  #10 → #11 (詳細ページ実装)
       → #12 (進捗取得API)

  #12 → #13 (トップページ進捗サマリー)

  #11 → #14 (リンク共有機能)
       → #15 (問い合わせ導線)

  #14, #15 → #16 (利用ログ記録API)

Phase 3: UI/UX改善
  #16 → #17 (レスポンシブ対応)
      → #18 (ローディング・エラーハンドリング)

  #17, #18 → #19 (未完了のみ表示フィルター)

Phase 4: 認証・堅牢化
  #19 → #20 (NextAuth.js簡易認証)

  #20 → #21 (Row Level Security設定)
      → #22 (テスト実装)

  #22 → #23 (エラー監視・ログ設定)

Phase 5: 将来機能
  #23 → #24 (管理ダッシュボード)
      → #25 (項目管理CRUD)
      → #26 (ユーザー管理)
      → #27 (Entra ID統合)
```

---

## Issueアウトライン表

### Issue #1: プロジェクトセットアップ

**概要**: Next.js 14プロジェクトを作成し、TypeScript・ESLint・Prettier・Tailwind CSS・shadcn/uiの開発環境を構築する

**依存**: -

**ラベル**: setup, infrastructure

**受け入れ基準（AC）**:

- [ ] `pnpm create next-app`でNext.js 14 (App Router)プロジェクト作成完了
- [ ] TypeScript strict mode有効化（`tsconfig.json`設定）
- [ ] ESLint + Prettier設定ファイル作成、pre-commit hooks (Husky)導入
- [ ] Tailwind CSS導入、`tailwind.config.ts`設定完了
- [ ] shadcn/ui初期化（`pnpm dlx shadcn-ui@latest init`）
- [ ] ディレクトリ構造作成（`app/`, `components/`, `lib/`, `types/`）
- [ ] `CLAUDE.md`をプロジェクトルートに配置

---

### Issue #2: Supabaseプロジェクト作成とDB初期化

**概要**: Supabaseプロジェクトを作成し、4つのテーブル（users, checklist_items, user_progress, activity_logs）とサンプルデータを投入する

**依存**: #1

**ラベル**: backend, database

**受け入れ基準（AC）**:

- [ ] Supabaseプロジェクト作成、プロジェクトURLとANON KEYを取得
- [ ] `supabase/migrations/`にDDL SQLファイル作成（4テーブル + インデックス）
- [ ] ローカルSupabase CLI導入（`pnpm add -D supabase`）、`supabase init`実行
- [ ] `supabase db push`でマイグレーション実行、テーブル作成確認
- [ ] Day1の1項目のみのサンプルデータを`seed.sql`で投入（Windowsログイン）
- [ ] Supabase管理画面でテーブル・データ確認完了

---

### Issue #3: Supabaseクライアント設定

**概要**: SupabaseのJavaScript SDKを導入し、Next.jsアプリケーションからSupabaseに接続できるようにする

**依存**: #2

**ラベル**: backend, infrastructure

**受け入れ基準（AC）**:

- [ ] `@supabase/supabase-js`パッケージ導入
- [ ] `.env.local`にSupabase環境変数設定（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
- [ ] `/lib/supabase/client.ts`作成（クライアントサイド用Supabaseクライアント）
- [ ] `/lib/supabase/server.ts`作成（サーバーサイド用Supabaseクライアント）
- [ ] シンプルなクエリテスト（`checklist_items`テーブルからデータ取得）が成功

---

### Issue #4: 簡易ユーザー識別機能（認証なし）

**概要**: 認証なしで、ローカルストレージベースの簡易ユーザー識別機能を実装する（初回アクセス時に名前入力、UUIDで識別）

**依存**: #1

**ラベル**: frontend, backend

**受け入れ基準（AC）**:

- [ ] 初回アクセス時に名前入力ダイアログ表示（shadcn/ui Dialog）
- [ ] 名前未入力の場合は「ゲスト」として扱う
- [ ] ローカルストレージにランダムUUID生成・保存（`user_id`キー）
- [ ] `/lib/user.ts`にユーザーID取得ヘルパー関数作成
- [ ] Supabase `users`テーブルに初回アクセス時にユーザーレコード作成（`id: UUID`, `name: 入力値`）
- [ ] 2回目以降のアクセスでは名前入力をスキップ

---

### Issue #5: トップページ（静的UI）

**概要**: トップページ（`/`）の静的UIを作成し、ヘッダー・フッター・Day選択カードのレイアウトを実装する（進捗表示なし）

**依存**: #1, #4

**ラベル**: frontend, ui

**受け入れ基準（AC）**:

- [ ] `/app/page.tsx`作成、トップページレイアウト実装
- [ ] `/app/layout.tsx`に共通ヘッダー・フッター配置
- [ ] ヘッダーにユーザー名表示（ローカルストレージから取得）
- [ ] Day1, 2, 3のカード表示（静的、進捗バーなし）
- [ ] shadcn/uiコンポーネント（Card, Button等）使用
- [ ] Tailwind CSSでモバイルファースト設計、レスポンシブ確認

---

### Issue #6: チェックリスト一覧ページ（Day1、1項目のみ）

**概要**: `/day/1`ページを作成し、API RouteからDay1のチェックリスト項目（1項目）を取得・表示する

**依存**: #3, #4, #5

**ラベル**: frontend, backend, api

**受け入れ基準（AC）**:

- [ ] `/app/day/1/page.tsx`作成、Day1チェックリストページ実装
- [ ] `/app/api/checklist-items/route.ts`作成（GET /api/checklist-items）
- [ ] Zodでクエリパラメータバリデーション（`day`パラメータ）
- [ ] Supabaseから`checklist_items`取得、`day=1`でフィルタリング
- [ ] チェックリストカードコンポーネント作成、1項目表示確認
- [ ] 認証チェックなし（誰でもアクセス可能）

---

### Issue #7: 進捗更新機能（1項目のみ）

**概要**: チェックリスト項目に「解決した」「解決しなかった」ボタンを追加し、進捗状態を更新できるようにする

**依存**: #6

**ラベル**: frontend, backend, api

**受け入れ基準（AC）**:

- [ ] `/app/api/progress/[checklistItemId]/route.ts`作成（PUT /api/progress/:checklistItemId）
- [ ] Zodでリクエストボディバリデーション（`status`, `notes`, `userId`）
- [ ] `user_progress`テーブルにINSERT/UPDATE（UPSERT）実装
- [ ] チェックリストカードに「解決した」「解決しなかった」ボタン追加
- [ ] ボタンクリックでAPI呼び出し、進捗更新成功確認
- [ ] React Queryでキャッシュ更新、UI即時反映

---

### Issue #8: Vercelデプロイ設定

**概要**: Vercelにプロジェクトをデプロイし、本番環境で動作確認する

**依存**: #7

**ラベル**: infrastructure, deployment

**受け入れ基準（AC）**:

- [ ] GitHubリポジトリ作成、コードpush完了
- [ ] Vercelプロジェクト作成、GitHubリポジトリ連携
- [ ] Vercel環境変数設定（Supabase URL/KEY）
- [ ] 初回デプロイ成功、本番URLアクセス確認
- [ ] 本番環境で名前入力→Day1ページ→進捗更新の動作確認
- [ ] プレビューデプロイ機能確認（PRごとに自動デプロイ）

---

### Issue #9: チェックリスト項目マスタデータ投入

**概要**: Day1-3の全チェックリスト項目データを作成し、Supabaseに投入する

**依存**: #8

**ラベル**: backend, database, content

**受け入れ基準（AC）**:

- [ ] Day1項目データ作成（4項目: Windowsログイン, M365, Teams, iPhone）
- [ ] Day2項目データ作成（6項目: ポータル, プリンタ, VPN等）
- [ ] Day3項目データ作成（5項目: よくあるトラブル対応）
- [ ] `supabase/seed.sql`に全項目INSERT文追加
- [ ] Supabase管理画面で15項目データ確認
- [ ] 各項目に`summary`, `steps` (JSONB), `notes`, `order_index`設定完了

---

### Issue #10: Day別一覧表示（Day1-3）

**概要**: Day2, Day3ページを作成し、Dayごとのチェックリスト項目を表示する

**依存**: #9

**ラベル**: frontend, api

**受け入れ基準（AC）**:

- [ ] `/app/day/2/page.tsx`作成、Day2チェックリスト表示
- [ ] `/app/day/3/page.tsx`作成、Day3チェックリスト表示
- [ ] 各ページで`/api/checklist-items?day=N`を呼び出し、データ取得
- [ ] Day別に複数項目表示確認（Day1: 4項目, Day2: 6項目, Day3: 5項目）
- [ ] 進捗バー表示（完了数/全体数）
- [ ] パンくずリスト追加（ホーム > DayN）

---

### Issue #11: 詳細ページ実装

**概要**: `/checklist/:id`ページを作成し、手順・注意点を表示する

**依存**: #10

**ラベル**: frontend, api

**受け入れ基準（AC）**:

- [ ] `/app/checklist/[id]/page.tsx`作成、詳細ページ実装
- [ ] `/app/api/checklist-items/[id]/route.ts`作成（GET /api/checklist-items/:id）
- [ ] パンくずリスト表示（ホーム > DayN > 項目名）
- [ ] 概要（summary）、手順（steps）、注意点（notes）セクション表示
- [ ] 手順リストにローカル状態のチェックボックス追加
- [ ] 戻るボタンでDay一覧ページへ遷移

---

### Issue #12: 進捗取得API実装

**概要**: ユーザーの進捗状態を取得するAPIを実装する

**依存**: #10

**ラベル**: backend, api

**受け入れ基準（AC）**:

- [ ] `/app/api/progress/route.ts`作成（GET /api/progress）
- [ ] クエリパラメータで`userId`を受け取り、該当ユーザーの`user_progress`データを取得
- [ ] クエリパラメータで`status`フィルタリング対応（pending, resolved, unresolved）
- [ ] レスポンスに`checklist_item`情報をJOIN
- [ ] サマリー集計（total, resolved, unresolved, pending）を返す
- [ ] Zodでバリデーション、エラーハンドリング実装

---

### Issue #13: トップページ進捗サマリー表示

**概要**: トップページに全体進捗率とDay別進捗カードを表示する

**依存**: #12

**ラベル**: frontend

**受け入れ基準（AC）**:

- [ ] `/app/page.tsx`を動的ページに変更
- [ ] GET /api/progress?userId=XXXを呼び出し、進捗データ取得
- [ ] 全体進捗率（完了数/全体数）を計算・表示
- [ ] Day別進捗カードに進捗バー表示（例: 3/4完了）
- [ ] React Queryでデータフェッチ、キャッシング設定
- [ ] ローディング状態・エラー状態のUI実装

---

### Issue #14: リンク共有機能

**概要**: 「この手順を送る」ボタンでチェックリスト項目のURLをクリップボードにコピーする機能を実装する

**依存**: #11

**ラベル**: frontend

**受け入れ基準（AC）**:

- [ ] 詳細ページに「この手順を送る」ボタン追加
- [ ] Clipboard APIで現在のURL（`/checklist/:id`）をコピー
- [ ] コピー成功時にトースト通知表示（shadcn/ui Toast）
- [ ] コピー失敗時のフォールバック処理（古いブラウザ対応）
- [ ] ボタンクリック時に`share_link`アクションのログ記録（API呼び出し）

---

### Issue #15: 問い合わせ導線実装

**概要**: 詳細ページに「教育担当に問い合わせる」ボタンを追加し、Teamsチャットリンクを開く導線を実装する

**依存**: #11

**ラベル**: frontend

**受け入れ基準（AC）**:

- [ ] `/lib/config.ts`作成、問い合わせURL（Teamsチャット）を環境変数で管理
- [ ] 詳細ページに「教育担当に問い合わせる」ボタン追加
- [ ] ボタンクリックでTeamsチャットリンクを新規タブで開く
- [ ] ボタンクリック時に`contact_click`アクションのログ記録（API呼び出し）
- [ ] Day一覧ページにも問い合わせボタン追加
- [ ] config.tsの値変更のみで全画面のリンク更新を確認

---

### Issue #16: 利用ログ記録API実装

**概要**: ユーザーの行動ログを記録するAPIを実装する

**依存**: #14, #15

**ラベル**: backend, api

**受け入れ基準（AC）**:

- [ ] `/app/api/logs/route.ts`作成（POST /api/logs）
- [ ] Zodでリクエストボディバリデーション（`userId`, `checklistItemId`, `action`, `metadata`）
- [ ] `activity_logs`テーブルにINSERT実装
- [ ] actionの種類（view, resolve, unresolve, contact_click, share_link）を検証
- [ ] エラーハンドリング、統一フォーマットのエラーレスポンス実装

---

### Issue #17: レスポンシブ対応

**概要**: 全ページをモバイルファースト設計でレスポンシブ対応する

**依存**: #16

**ラベル**: frontend, ui

**受け入れ基準（AC）**:

- [ ] トップページ、Day一覧、詳細ページをモバイル（〜640px）で表示確認
- [ ] タブレット（641px〜1024px）、デスクトップ（1025px〜）で表示確認
- [ ] Tailwind CSSブレークポイント（sm, md, lg）を使用
- [ ] ボタン・カードのタッチターゲットサイズ最適化（最小44x44px）
- [ ] ヘッダー・ナビゲーションをモバイルで折りたたみ可能に
- [ ] 実機（iPhone）で動作確認

---

### Issue #18: ローディング・エラーハンドリング

**概要**: 全ページにローディング状態、エラー状態のUIを実装する

**依存**: #17

**ラベル**: frontend, ui

**受け入れ基準（AC）**:

- [ ] `/app/loading.tsx`作成、スケルトンスクリーン表示
- [ ] `/app/error.tsx`作成、エラーバウンダリ実装
- [ ] React Queryでローディング・エラー状態を管理
- [ ] APIエラー時にトースト通知表示
- [ ] 404ページ（`/app/not-found.tsx`）カスタムデザイン
- [ ] 500ページ（`/app/error.tsx`）に再試行ボタン追加

---

### Issue #19: 未完了のみ表示フィルター

**概要**: トップページに「未完了のみ表示」トグルスイッチを追加し、未完了項目のみを表示できるようにする

**依存**: #13, #18

**ラベル**: frontend

**受け入れ基準（AC）**:

- [ ] トップページにトグルスイッチ（shadcn/ui Switch）追加
- [ ] トグルON時に`status=pending,unresolved`でフィルタリング
- [ ] React状態管理でフィルター状態を保持
- [ ] フィルター適用時にDay別カードの項目数を再計算
- [ ] ローカルストレージにフィルター状態を保存（次回訪問時に復元）

---

### Issue #20: NextAuth.js簡易認証（Credentials Provider）

**概要**: NextAuth.js v5を導入し、メールアドレス＋パスワードの簡易認証を実装する

**依存**: #19

**ラベル**: backend, auth

**受け入れ基準（AC）**:

- [ ] `next-auth@beta`パッケージ導入
- [ ] `/app/api/auth/[...nextauth]/route.ts`作成
- [ ] Credentials Providerでメールアドレス＋パスワード認証実装
- [ ] `/lib/auth.ts`に認証ヘルパー関数作成（`getServerSession`等）
- [ ] ミドルウェア（`middleware.ts`）で未認証時にログインページへリダイレクト
- [ ] ユーザー登録ページ（`/app/auth/signup/page.tsx`）作成
- [ ] Supabase `users`テーブルにメールアドレス・パスワード（ハッシュ化）保存
- [ ] 既存の匿名ユーザーデータを認証ユーザーに紐付け（オプション機能として実装）

---

### Issue #21: Row Level Security (RLS) 設定

**概要**: Supabaseで行レベルアクセス制御を実装し、セキュリティを強化する

**依存**: #20

**ラベル**: backend, database, security

**受け入れ基準（AC）**:

- [ ] `users`テーブルにRLSポリシー設定（自分の情報のみ閲覧・更新可能）
- [ ] `user_progress`テーブルにRLSポリシー設定（自分の進捗のみ閲覧・更新可能）
- [ ] `activity_logs`テーブルにRLSポリシー設定（自分のログのみ作成可能）
- [ ] `checklist_items`テーブルにRLSポリシー設定（全員が閲覧可能）
- [ ] RLS有効化後に各APIの動作確認（認証ユーザーのみアクセス可能）
- [ ] 他ユーザーのデータにアクセスできないことを確認

---

### Issue #22: テスト実装

**概要**: 重要なビジネスロジックの単体テストとE2Eテストを実装する

**依存**: #21

**ラベル**: testing

**受け入れ基準（AC）**:

- [ ] Vitestパッケージ導入（`pnpm add -D vitest @testing-library/react`）
- [ ] `/lib/`配下のユーティリティ関数の単体テスト作成
- [ ] API RouteのZodバリデーションテスト作成
- [ ] Playwright導入（`pnpm add -D @playwright/test`）
- [ ] E2Eテスト作成（ログイン→Day1→進捗更新の一連フロー）
- [ ] GitHub Actionsでテスト自動実行設定

---

### Issue #23: エラー監視・ログ設定

**概要**: Vercel Analyticsを導入し、エラートラッキング・パフォーマンス監視を設定する

**依存**: #22

**ラベル**: infrastructure, monitoring

**受け入れ基準（AC）**:

- [ ] Vercel Analytics導入（`@vercel/analytics`パッケージ）
- [ ] `app/layout.tsx`にAnalyticsコンポーネント追加
- [ ] Vercel Speed Insights有効化
- [ ] エラーログ記録（Next.js標準のconsole.error）
- [ ] 本番環境でエラートラッキング動作確認
- [ ] Vercelダッシュボードで統計確認

---

### Issue #24: 管理ダッシュボード（将来機能）

**概要**: 管理者向けダッシュボード（`/admin`）を作成し、統計情報を表示する

**依存**: #23

**ラベル**: frontend, backend, admin

**受け入れ基準（AC）**:

- [ ] `/app/admin/page.tsx`作成、管理ダッシュボード実装
- [ ] `/app/api/admin/stats/route.ts`作成（GET /api/admin/stats）
- [ ] ロールベースアクセス制御（`role === 'admin' || role === 'trainer'`）
- [ ] サマリーカード（総ユーザー数、アクティブユーザー数、全体完了率）表示
- [ ] 未解決ランキングTop5表示
- [ ] よく見られている項目Top5表示

---

### Issue #25: 項目管理CRUD（将来機能）

**概要**: 管理者がチェックリスト項目をCRUD操作できるページを実装する

**依存**: #24

**ラベル**: frontend, backend, admin

**受け入れ基準（AC）**:

- [ ] `/app/admin/items/page.tsx`作成、項目一覧ページ実装
- [ ] `/app/api/admin/items/route.ts`作成（POST, PUT, DELETE）
- [ ] 項目一覧テーブル（Day、カテゴリ、タイトル、表示順、有効/無効）
- [ ] 新規項目追加フォーム（Zodバリデーション）
- [ ] 項目編集・削除機能
- [ ] Dayフィルター、ステータスフィルター実装

---

### Issue #26: ユーザー管理（将来機能）

**概要**: 管理者がユーザー一覧を確認し、ロール変更できるページを実装する

**依存**: #24

**ラベル**: frontend, backend, admin

**受け入れ基準（AC）**:

- [ ] `/app/admin/users/page.tsx`作成、ユーザー一覧ページ実装
- [ ] `/app/api/admin/users/route.ts`作成（GET, PUT）
- [ ] ユーザー一覧テーブル（名前、メールアドレス、入社日、ロール、進捗率）
- [ ] ロール変更ドロップダウン（user, trainer, admin）
- [ ] 検索バー（名前、メールアドレス）実装
- [ ] ページネーション実装（1ページ50人）

---

### Issue #27: Entra ID統合（将来機能）

**概要**: NextAuth.js v5のEntra ID (Azure AD) Providerに切り替え、企業SSOを実装する

**依存**: #20

**ラベル**: backend, auth

**受け入れ基準（AC）**:

- [ ] Entra ID（Azure AD）でアプリケーション登録、Client ID/Secret取得
- [ ] NextAuth.js設定をEntra ID Providerに変更
- [ ] OAuth 2.0 / OpenID Connectフロー実装
- [ ] `.env.local`にEntra ID環境変数追加
- [ ] ログイン→リダイレクト→トークン取得の動作確認
- [ ] Supabase `users`テーブルに`entra_id`カラムでユーザー自動作成
- [ ] Credentials Providerと併用可能な設定（既存ユーザーへの影響最小化）

---

## 補足情報

### 要件確認結果

1. **Entra ID登録権限**: 開発者が自由に登録可能
2. **Teamsチャットリンク**: 後で設定（`/lib/config.ts`で管理）
3. **初期ユーザーデータ**: 手動登録
4. **チェックリスト項目内容**: 開発者が作成
5. **本番環境公開範囲**: Phase 1-2は認証なし（誰でもアクセス可能）、Phase 4以降で認証追加

### 開発の進め方

- **Phase 1-2**: 認証なしで最速でMVPを完成させる
- **Phase 3**: UI/UX改善でユーザー体験を向上
- **Phase 4**: 簡易認証を追加してセキュリティを強化
- **Phase 5**: Entra ID統合や管理機能を追加（将来機能）

### 見積もり

- **Phase 1 (Walking Skeleton)**: 3〜5日
- **Phase 2 (MVP完成)**: 5〜7日
- **Phase 3 (UI/UX改善)**: 2〜3日
- **Phase 4 (認証・堅牢化)**: 3〜4日
- **Phase 5 (将来機能)**: 5〜7日

**合計**: 18〜26日（約1ヶ月）
