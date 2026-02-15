# Issue #15: 問い合わせ導線実装

## 背景 / 目的

詳細ページに「教育担当に問い合わせる」ボタンを追加し、Teamsチャットリンクを開く導線を実装する。これにより、新入社員が困った時にすぐに教育担当者に連絡できる。

- **依存**: #11
- **ラベル**: frontend

## スコープ / 作業項目

1. `/lib/config.ts`作成（問い合わせURLを環境変数で管理）
2. 詳細ページに「教育担当に問い合わせる」ボタン追加
3. ボタンクリックでTeamsチャットリンクを新規タブで開く
4. `contact_click`アクションのログ記録
5. Day一覧ページにも問い合わせボタン追加

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/lib/config.ts`作成、問い合わせURL（Teamsチャット）を環境変数で管理
- [ ] 詳細ページに「教育担当に問い合わせる」ボタン追加
- [ ] ボタンクリックでTeamsチャットリンクを新規タブで開く
- [ ] ボタンクリック時に`contact_click`アクションのログ記録（API呼び出し）
- [ ] Day一覧ページにも問い合わせボタン追加
- [ ] config.tsの値変更のみで全画面のリンク更新を確認

## テスト観点

- **問い合わせボタン**: 詳細ページ・Day一覧ページに問い合わせボタンが表示されること
- **リンク動作**: ボタンクリックでTeamsチャットリンクが新規タブで開くこと
- **環境変数**: `.env.local`でURLを変更すると、全画面のリンクが更新されること
- **ログ記録**: `activity_logs`テーブルに`contact_click`アクションが記録されること

### 検証方法

```bash
# .env.localに問い合わせURL追加
NEXT_PUBLIC_CONTACT_URL=https://teams.microsoft.com/l/chat/...

# 開発サーバー再起動
pnpm dev

# ブラウザでアクセス
# http://localhost:3000/checklist/{CHECKLIST_ITEM_ID}
# 「教育担当に問い合わせる」ボタンをクリック
# 新規タブでTeamsチャットが開くことを確認
```

## 実装例（docs/05_sitemap.md参照）

### /lib/config.ts

```typescript
export const config = {
  contactUrl: process.env.NEXT_PUBLIC_CONTACT_URL || '#',
  contactMethod: process.env.NEXT_PUBLIC_CONTACT_METHOD || 'Teams',
};
```

### /.env.local（追加）

```bash
# 問い合わせ先URL（Teamsチャット）
NEXT_PUBLIC_CONTACT_URL=https://teams.microsoft.com/l/chat/0/0?users=support@example.com
NEXT_PUBLIC_CONTACT_METHOD=Teams
```

### /.env.example（追加）

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 問い合わせ先URL（Teamsチャット）
NEXT_PUBLIC_CONTACT_URL=https://teams.microsoft.com/l/chat/0/0?users=support@example.com
NEXT_PUBLIC_CONTACT_METHOD=Teams
```

### /components/contact-button.tsx

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { config } from '@/lib/config';
import { getUserId } from '@/lib/user';

export function ContactButton({ checklistItemId }: { checklistItemId?: string }) {
  const handleContact = async () => {
    // ログ記録
    if (checklistItemId) {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          checklistItemId,
          action: 'contact_click',
          metadata: { method: config.contactMethod },
        }),
      });
    }

    // Teamsチャットを新規タブで開く
    window.open(config.contactUrl, '_blank');
  };

  return (
    <Button onClick={handleContact} variant="secondary">
      💬 教育担当に問い合わせる（{config.contactMethod}）
    </Button>
  );
}
```

### /components/checklist-detail.tsx（更新）

```typescript
import { ContactButton } from '@/components/contact-button';

export function ChecklistDetail({ item }: { item: any }) {
  return (
    <div className="container mx-auto p-4">
      {/* ... 既存のコード ... */}

      <div className="flex gap-2 mt-6">
        <Button onClick={handleShareLink} disabled={copying} variant="outline">
          📋 この手順を送る
        </Button>
        <ContactButton checklistItemId={item.id} />
        <Button onClick={() => router.back()}>← 戻る</Button>
      </div>
    </div>
  );
}
```

### /app/day/[id]/page.tsx（問い合わせボタン追加）

```typescript
import { ContactButton } from '@/components/contact-button';

export default async function DayPage({ params }: { params: { id: string } }) {
  // ... 既存のコード ...

  return (
    <div className="container mx-auto p-4">
      {/* ... */}
      <div className="mt-6">
        <ContactButton />
      </div>
    </div>
  );
}
```

## Teamsチャットリンク形式

```
https://teams.microsoft.com/l/chat/0/0?users=support@example.com&message=ITオンボーディングについて質問があります
```

パラメータ：

- `users`: 問い合わせ先のメールアドレス
- `message`: 初期メッセージ（オプション）

## 要確認事項

- 問い合わせ先のTeamsチャットURLは決まっているか？（後で設定でもOK）
- 問い合わせ方法はTeamsチャットのみか？（フォーム、メール等の選択肢もあり）
