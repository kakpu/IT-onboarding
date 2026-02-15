# Issue #17: レスポンシブ対応

## 背景 / 目的

全ページをモバイルファースト設計でレスポンシブ対応する。新入社員はiPhoneでも閲覧するため、モバイル表示の最適化が重要。

- **依存**: #16
- **ラベル**: frontend, ui

## スコープ / 作業項目

1. トップページ、Day一覧、詳細ページのレスポンシブ対応
2. Tailwind CSSブレークポイント（sm, md, lg）を使用
3. ボタン・カードのタッチターゲットサイズ最適化
4. ヘッダー・ナビゲーションをモバイルで折りたたみ可能に
5. 実機（iPhone）で動作確認

## ゴール / 完了条件（Acceptance Criteria）

- [ ] トップページ、Day一覧、詳細ページをモバイル（〜640px）で表示確認
- [ ] タブレット（641px〜1024px）、デスクトップ（1025px〜）で表示確認
- [ ] Tailwind CSSブレークポイント（sm, md, lg）を使用
- [ ] ボタン・カードのタッチターゲットサイズ最適化（最小44x44px）
- [ ] ヘッダー・ナビゲーションをモバイルで折りたたみ可能に
- [ ] 実機（iPhone）で動作確認

## テスト観点

- **モバイル表示**: iPhone（Safari）で全ページが正常に表示されること
- **タブレット表示**: iPad（Safari）で全ページが正常に表示されること
- **デスクトップ表示**: PC（Chrome, Firefox, Edge）で全ページが正常に表示されること
- **タッチターゲット**: ボタン・リンクが指で押しやすいサイズであること（最小44x44px）
- **ナビゲーション**: モバイルでハンバーガーメニューが正常に動作すること

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# DevTools > Toggle device toolbarでモバイル表示確認
# - iPhone SE (375x667)
# - iPhone 14 Pro (393x852)
# - iPad (768x1024)

# 実機確認（iPhoneでアクセス）
# http://{YOUR_IP}:3000
```

## Tailwind CSSブレークポイント

| ブレークポイント | 画面幅   | デバイス           |
| ---------------- | -------- | ------------------ |
| (default)        | 〜640px  | モバイル           |
| sm               | 640px〜  | 大きめのスマホ     |
| md               | 768px〜  | タブレット         |
| lg               | 1024px〜 | デスクトップ       |
| xl               | 1280px〜 | 大画面デスクトップ |

## 実装例（docs/05_sitemap.md参照）

### レスポンシブグリッド（トップページ）

```typescript
// モバイル: 1列、タブレット以上: 3列
<div className="grid gap-4 grid-cols-1 md:grid-cols-3">
  {/* Day別カード */}
</div>
```

### レスポンシブフォント

```typescript
// モバイル: text-xl、デスクトップ: text-2xl
<h1 className="text-xl md:text-2xl font-bold">ITオンボーディング</h1>
```

### レスポンシブパディング

```typescript
// モバイル: p-4、デスクトップ: p-8
<div className="container mx-auto p-4 md:p-8">
  {/* コンテンツ */}
</div>
```

### タッチターゲットサイズ最適化

```typescript
// ボタンの最小サイズ: 44x44px
<Button className="min-h-[44px] min-w-[44px]">
  解決した
</Button>
```

### モバイルナビゲーション（ハンバーガーメニュー）

#### /components/mobile-nav.tsx

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          ☰
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="flex flex-col gap-4">
          <Link href="/" onClick={() => setOpen(false)}>
            ホーム
          </Link>
          <Link href="/day/1" onClick={() => setOpen(false)}>
            Day1
          </Link>
          <Link href="/day/2" onClick={() => setOpen(false)}>
            Day2
          </Link>
          <Link href="/day/3" onClick={() => setOpen(false)}>
            Day3
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

#### /app/layout.tsx（ヘッダー更新）

```typescript
import { MobileNav } from '@/components/mobile-nav';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="border-b">
          <div className="container mx-auto p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MobileNav />
              <h1 className="text-lg md:text-xl font-bold">ITオンボーディング</h1>
            </div>
            {/* デスクトップナビゲーション */}
            <nav className="hidden md:flex gap-4">
              <Link href="/">ホーム</Link>
              <Link href="/day/1">Day1</Link>
              <Link href="/day/2">Day2</Link>
              <Link href="/day/3">Day3</Link>
            </nav>
          </div>
        </header>
        {/* ... */}
      </body>
    </html>
  );
}
```

## 要確認事項

- shadcn/ui Sheetコンポーネントはインストール済みか？（未インストールの場合: `pnpm dlx shadcn-ui@latest add sheet`）
- 実機確認用のiPhoneは用意できるか？
