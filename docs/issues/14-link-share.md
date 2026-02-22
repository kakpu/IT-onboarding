# Issue #14: リンク共有機能

## 背景 / 目的

「この手順を送る」ボタンでチェックリスト項目のURLをクリップボードにコピーする機能を実装する。これにより、教育担当者が新入社員に具体的な手順URLを共有できる。

- **依存**: #11
- **ラベル**: frontend

## スコープ / 作業項目

1. 詳細ページに「この手順を送る」ボタン追加
2. Clipboard APIでURLコピー
3. トースト通知表示（コピー成功時）
4. フォールバック処理（古いブラウザ対応）
5. `share_link`アクションのログ記録

## ゴール / 完了条件（Acceptance Criteria）

- [ ] 詳細ページに「この手順を送る」ボタン追加
- [ ] Clipboard APIで現在のURL（`/checklist/:id`）をコピー
- [ ] コピー成功時にトースト通知表示（shadcn/ui Toast）
- [ ] コピー失敗時のフォールバック処理（古いブラウザ対応）
- [ ] ボタンクリック時に`share_link`アクションのログ記録（API呼び出し）

## テスト観点

- **コピー機能**: ボタンクリックでURLがクリップボードにコピーされること
- **トースト通知**: コピー成功時にトースト通知が表示されること
- **フォールバック**: Clipboard APIが使えないブラウザでもエラーが発生しないこと
- **ログ記録**: `activity_logs`テーブルに`share_link`アクションが記録されること

### 検証方法

```bash
# shadcn/ui Toast, Sonner導入
pnpm dlx shadcn-ui@latest add sonner

# 開発サーバー起動
pnpm dev

# ブラウザでアクセス
# http://localhost:3000/checklist/{CHECKLIST_ITEM_ID}
# 「この手順を送る」ボタンをクリック
# クリップボードにURLがコピーされることを確認
# トースト通知が表示されることを確認
```

## 実装例

### /components/checklist-detail.tsx（更新）

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getUserId } from '@/lib/user';

export function ChecklistDetail({ item }: { item: any }) {
  const [copying, setCopying] = useState(false);

  const handleShareLink = async () => {
    setCopying(true);

    try {
      const url = window.location.href;

      // Clipboard APIでコピー
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // フォールバック: テキストエリアを使ったコピー
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      toast.success('URLをコピーしました');

      // ログ記録
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          checklistItemId: item.id,
          action: 'share_link',
          metadata: { url },
        }),
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('URLのコピーに失敗しました');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* ... 既存のコード ... */}

      <div className="flex gap-2 mt-6">
        <Button onClick={handleShareLink} disabled={copying} variant="outline">
          📋 この手順を送る
        </Button>
        <Button onClick={() => router.back()}>← 戻る</Button>
      </div>
    </div>
  );
}
```

### /app/layout.tsx（Toaster追加）

```typescript
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          {/* ... */}
          {children}
          {/* ... */}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

## Clipboard API対応ブラウザ

- Chrome 63+
- Firefox 53+
- Safari 13.1+
- Edge 79+

古いブラウザでは`document.execCommand('copy')`を使用するフォールバック処理を実装

## 要確認事項

- トースト通知のライブラリはSonnerでよいか？（shadcn/ui標準）
