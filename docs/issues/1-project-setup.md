# Issue #1: プロジェクトセットアップ

## 背景 / 目的

Next.js 14 (App Router)をベースとした開発環境を構築し、TypeScript・ESLint・Prettier・Tailwind CSS・shadcn/uiの標準的な設定を完了させる。これにより、型安全性・コード品質・UI開発効率を確保する。

- **依存**: -
- **ラベル**: setup, infrastructure

## スコープ / 作業項目

1. Next.js 14プロジェクトの作成（App Router）
2. TypeScript strict mode有効化
3. ESLint + Prettier設定ファイル作成
4. Husky導入（pre-commit hooks）
5. Tailwind CSS導入・設定
6. shadcn/ui初期化
7. ディレクトリ構造作成
8. CLAUDE.mdの配置

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `pnpm create next-app`でNext.js 14 (App Router)プロジェクト作成完了
- [ ] TypeScript strict mode有効化（`tsconfig.json`で`strict: true`設定）
- [ ] ESLint + Prettier設定ファイル作成、pre-commit hooks (Husky)導入完了
- [ ] Tailwind CSS導入、`tailwind.config.ts`設定完了
- [ ] shadcn/ui初期化（`pnpm dlx shadcn-ui@latest init`）完了
- [ ] ディレクトリ構造作成（`app/`, `components/`, `lib/`, `types/`）
- [ ] `CLAUDE.md`をプロジェクトルートに配置し、Gitコミット完了

## テスト観点

- **ビルド確認**: `pnpm build`が成功すること
- **Lint確認**: `pnpm lint`がエラーなく実行されること
- **型チェック**: `pnpm tsc --noEmit`がエラーなく実行されること
- **開発サーバー**: `pnpm dev`でローカルサーバーが起動し、http://localhost:3000 にアクセスできること

### 検証方法

```bash
# プロジェクト作成
pnpm create next-app@latest it-onboarding --typescript --tailwind --app --src-dir=false --import-alias="@/*"

cd it-onboarding

# shadcn/ui初期化
pnpm dlx shadcn-ui@latest init

# Husky導入
pnpm add -D husky
pnpm exec husky init

# ビルド・Lint確認
pnpm build
pnpm lint
```

## 要確認事項

- プロジェクト名は `it-onboarding` で良いか？（別名を希望する場合は変更）
- shadcn/uiのスタイル設定（New York / Default）はどちらを選択するか？（推奨: Default）
