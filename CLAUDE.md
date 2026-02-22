# Claude Code プロジェクトルール

このドキュメントは、本プロジェクト（IT-onboarding）における開発ルールとClaude Codeに期待する動作を定義します。

## 基本方針

### 言語設定

- **回答言語**: 基本的に**日本語**で回答してください
- **コード内コメント**: 日本語で記述（変数名・関数名は英語）
- **エラーメッセージ**: 日本語で記述
- **ドキュメント**: 日本語で記述（技術用語は英語併記可）

### コミュニケーション

- 冗長な説明は避け、簡潔かつ明確に
- 専門用語は必要に応じて補足説明を追加
- コードブロックには必ずファイルパスとコメントを付与

---

## コミットメッセージフォーマット

### 基本ルール

```
<type>: <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Type一覧

- `feat`: 新機能追加
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの動作に影響しない変更（フォーマット、セミコロンなど）
- `refactor`: バグ修正や機能追加を伴わないコード改善
- `perf`: パフォーマンス改善
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツール、ライブラリの変更
- `ci`: CI/CD設定の変更

### 例

```
feat: Day1チェックリスト画面の実装

- チェックリストコンポーネントの作成
- 進捗状態管理機能の追加
- レスポンシブ対応

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 注意事項

- **subject**: 50文字以内、命令形で記述
- **body**: 変更の理由と内容を簡潔に（必要な場合のみ）
- 1つのコミットには1つの論理的な変更のみを含める
- WIPコミットは避ける

---

## 技術スタック

本プロジェクトで使用する技術：

### フロントエンド

- **Next.js 14 (App Router)**: サーバーコンポーネント優先
- **TypeScript**: strict modeで型安全性を確保
- **Tailwind CSS**: ユーティリティファーストのスタイリング
- **shadcn/ui**: アクセシブルなUIコンポーネント
- **React Query**: サーバーステート管理

### バックエンド

- **Next.js API Routes**: サーバーレス関数
- **Zod**: スキーマバリデーション
- **NextAuth.js v5**: 認証（Entra ID連携）

### データベース

- **Supabase (PostgreSQL)**: メインDB
- **Row Level Security (RLS)**: 行レベルアクセス制御

### 開発ツール

- **pnpm**: パッケージマネージャ
- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマット
- **Husky**: Git hooks（pre-commit）

---

## コーディング規約

- 既存のコードスタイルに従う
- 不要なコメントは追加しない（ユーザーが明示的に要求した場合は除く）

### TypeScript

- **strict mode** を有効化（`tsconfig.json`）
- 型注釈は必要最小限に（型推論を活用）
- 型定義は必須　`any` 型の使用は禁止
- インターフェースよりも `type` を優先（一貫性のため）

```typescript
// Good
type User = {
  id: string;
  name: string;
  email: string;
};

// Bad
interface User {
  id: string;
  name: string;
  email: string;
}
```

### Next.js App Router

- **Server Components** をデフォルトとする
- Client Componentsは必要最小限（`'use client'` を明示）
- データフェッチは可能な限りサーバーサイドで実行
- ファイル構成は Next.js 14 の規約に従う

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx
├── dashboard/
│   ├── layout.tsx
│   └── page.tsx
├── api/
│   └── route.ts
└── layout.tsx
```

### React / JSX

- **関数コンポーネント** のみ使用（クラスコンポーネント不可）
- Hooksのルールに従う（`use` prefix、トップレベルでのみ使用）
- propsの分割代入を推奨

```tsx
// Good
export function UserCard({ name, email }: UserCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-bold">{name}</h3>
      <p className="text-sm text-gray-600">{email}</p>
    </div>
  );
}

// Bad
export function UserCard(props: UserCardProps) {
  return <div>{props.name}</div>;
}
```

### Tailwind CSS

- ユーティリティクラスを優先（カスタムCSSは原則として書かない）
- `@apply` の使用は避ける（shadcn/ui スタイルに従う）
- レスポンシブデザインは mobile-first で記述

```tsx
// Good
<div className="flex flex-col gap-4 md:flex-row">

// Bad
<div style={{ display: 'flex', gap: '1rem' }}>
```

### ファイル命名規則

- コンポーネント: `PascalCase.tsx`（例: `ChecklistItem.tsx`）
- ユーティリティ関数: `kebab-case.ts`（例: `format-date.ts`）
- API Routes: `route.ts`
- ページ: `page.tsx`
- レイアウト: `layout.tsx`

### コメント

- **関数・コンポーネント**: JSDocで説明を記述
- **複雑なロジック**: インラインコメントで意図を明記
- **TODO/FIXME**: 必ず Issue番号を併記

```typescript
/**
 * ユーザーの進捗率を計算する
 * @param completedCount - 完了したタスク数
 * @param totalCount - 全タスク数
 * @returns 0-100の進捗率
 */
export function calculateProgress(completedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}
```

---

## セキュリティ・品質基準

### セキュリティ

- **認証**: すべてのAPIエンドポイントで認証チェック必須
- **認可**: ロールベースでアクセス制御を実装
- **入力検証**: Zodでバリデーション（サーバーサイド必須）
- **SQLインジェクション対策**: Supabase クライアントを使用（生SQL禁止）
- **XSS対策**: React標準のエスケープに依存（`dangerouslySetInnerHTML` 禁止）
- **CSRF対策**: NextAuth.js標準機能を使用
- **環境変数**: `.env.local` で管理（`.env` は Git 管理下に置かない）

```typescript
// Good: Zodでバリデーション
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = UserSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  // ... 処理
}
```

### パフォーマンス

- **画像最適化**: `next/image` コンポーネントを使用
- **コード分割**: Dynamic Importを活用
- **キャッシング**: React Query のキャッシュ戦略を適切に設定
- **バンドルサイズ**: 不要な依存関係は追加しない

### エラーハンドリング

- すべての非同期処理で適切なエラーハンドリング
- ユーザーフレンドリーなエラーメッセージ
- エラーログは詳細に記録（本番環境）

```typescript
// Good
try {
  const data = await fetchUserData(userId);
  return Response.json(data);
} catch (error) {
  console.error('Failed to fetch user data:', error);
  return Response.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 });
}
```

---

## コード品質の観点

### DRY原則（Don't Repeat Yourself）

- 同じロジックの重複は関数・コンポーネント化
- 3回以上使う処理は共通化を検討

### YAGNI原則（You Aren't Gonna Need It）

- 現時点で不要な機能は実装しない
- 将来の拡張性よりも現在のシンプルさを優先

### 関数の責務

- 1つの関数は1つの責務のみ
- 関数は50行以内を目安に
- 副作用のある関数と純粋関数を明確に分離

### コンポーネント設計

- 小さく再利用可能なコンポーネントを作成
- propsは5個以内を目安に（多い場合はオブジェクトにまとめる）
- 状態管理は可能な限りローカルに

### テスト

- 重要なビジネスロジックは単体テスト必須
- E2Eテストは主要なユーザーフローのみ
- テストコードも保守性を意識

---

## 開発ワークフロー

### ブランチ戦略

- `main`: 本番環境（常に安定）
- `develop`: 開発環境（機能統合）
- `feature/*`: 機能開発ブランチ
- `fix/*`: バグ修正ブランチ

### プルリクエスト

- タイトルは簡潔に（50文字以内）
- 説明には以下を含める：
  - 変更内容のサマリー
  - テスト方法
  - スクリーンショット（UI変更時）
- レビュー後にマージ

### コードレビューの観点

- ロジックの正確性
- セキュリティリスクの有無
- パフォーマンスへの影響
- テストの充足性
- コーディング規約の遵守

---

## 参考ドキュメント

プロジェクトの詳細は `docs/` 配下を参照：

- [要件定義](docs/01_requirements.md)
- [アーキテクチャ設計](docs/02_architecture.md)
- [データベース設計](docs/03_database.md)
- [API設計](docs/04_api.md)
- [サイトマップ](docs/05_sitemap.md)

---

## Claudeへの期待事項

### 重要な注意事項

- ユーザーが明示的に要求していない変更は行わない
- コミットはユーザーが明示的に要求した場合のみ

### コード生成時

- 常に型安全性を優先
- セキュリティリスクを考慮
- 既存コードのパターンに従う
- 過度な抽象化を避ける

### 質問・提案時

- 複数の選択肢がある場合は理由とともに提示
- トレードオフを明確に説明
- 不明点があれば確認してから実装

### ドキュメント作成時

- 読み手を意識した構成
- コード例を積極的に使用
- 図解・表を活用（mermaid推奨）

---

**最終更新**: 2026-02-14
