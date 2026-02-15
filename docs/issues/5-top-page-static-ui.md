# Issue #5: トップページ（静的UI）

## 背景 / 目的

トップページ（`/`）の静的UIを作成し、ヘッダー・フッター・Day選択カードのレイアウトを実装する。進捗表示は後のIssueで実装するため、この段階では静的な表示のみ。

- **依存**: #1, #4
- **ラベル**: frontend, ui

## スコープ / 作業項目

1. `/app/page.tsx`作成（トップページ）
2. `/app/layout.tsx`に共通レイアウト（ヘッダー・フッター）配置
3. ヘッダーにユーザー名表示（ローカルストレージから取得）
4. Day1, 2, 3のカード表示（静的、進捗バーなし）
5. shadcn/uiコンポーネント使用（Card, Button等）
6. Tailwind CSSでモバイルファースト設計

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/page.tsx`作成、トップページレイアウト実装完了
- [ ] `/app/layout.tsx`に共通ヘッダー・フッター配置
- [ ] ヘッダーにユーザー名表示（ローカルストレージから取得）
- [ ] Day1, 2, 3のカード表示（静的、進捗バーなし）
- [ ] shadcn/uiコンポーネント（Card, Button等）使用
- [ ] Tailwind CSSでモバイルファースト設計、レスポンシブ確認（モバイル・タブレット・デスクトップ）

## テスト観点

- **レイアウト確認**: ヘッダー・フッター・Day選択カードが正しく表示されること
- **ユーザー名表示**: ヘッダーにローカルストレージから取得したユーザー名が表示されること
- **レスポンシブ確認**: モバイル（〜640px）、タブレット（641px〜1024px）、デスクトップ（1025px〜）で表示崩れがないこと
- **リンク動作**: Day1, 2, 3のカードをクリックすると、それぞれ`/day/1`, `/day/2`, `/day/3`に遷移すること（404になるが問題なし）

### 検証方法

```bash
# shadcn/ui Card, Button コンポーネント追加
pnpm dlx shadcn-ui@latest add card button

# 開発サーバー起動
pnpm dev

# ブラウザでアクセス
# http://localhost:3000

# レスポンシブ確認
# DevTools > Toggle device toolbar でモバイル・タブレット表示確認
```

## 実装例（docs/05_sitemap.md参照）

### /app/page.tsx

```typescript
import { getUserName } from '@/lib/user';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ITオンボーディング</h1>
      <p className="mb-6">こんにちは、{getUserName() || 'ゲスト'}さん</p>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Day1 初期設定</CardTitle>
            <CardDescription>ログイン・M365・Teams・iPhone初期設定</CardDescription>
          </CardHeader>
          <Link href="/day/1">
            <Button className="w-full">詳細を見る →</Button>
          </Link>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day2 ポータル・ツール設定</CardTitle>
            <CardDescription>ポータル・プリンタ・VPN・セキュリティ確認</CardDescription>
          </CardHeader>
          <Link href="/day/2">
            <Button className="w-full">詳細を見る →</Button>
          </Link>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day3 トラブル対応</CardTitle>
            <CardDescription>よくあるトラブル対応</CardDescription>
          </CardHeader>
          <Link href="/day/3">
            <Button className="w-full">詳細を見る →</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
```

### /app/layout.tsx

```typescript
import './globals.css';
import { Inter } from 'next/font/google';
import { UserSetupDialog } from '@/components/user-setup-dialog';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ITオンボーディング',
  description: 'Day1-3のIT初期設定をサポート',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <header className="border-b">
          <div className="container mx-auto p-4">
            <h1 className="text-xl font-bold">ITオンボーディング</h1>
          </div>
        </header>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="border-t">
          <div className="container mx-auto p-4 text-center text-sm text-gray-600">
            © 2024 IT-onboarding
          </div>
        </footer>
        <UserSetupDialog />
      </body>
    </html>
  );
}
```

## 要確認事項

- Day2, Day3のカード説明文は仮のもの。正確な内容はチェックリスト項目データ投入時に反映される。
