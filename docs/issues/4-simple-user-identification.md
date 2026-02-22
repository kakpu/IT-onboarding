# Issue #4: 簡易ユーザー識別機能（認証なし）

## 背景 / 目的

Phase 1-2では認証を実装せず、最速でMVPを完成させる。そのため、ローカルストレージベースの簡易ユーザー識別機能を実装し、初回アクセス時に名前を入力してもらい、UUIDで識別する。これにより、進捗管理・ログ記録が可能になる。

- **依存**: #1
- **ラベル**: frontend, backend

## スコープ / 作業項目

1. 初回アクセス時の名前入力ダイアログ実装
2. ローカルストレージへのUUID保存
3. ユーザーID取得ヘルパー関数作成
4. Supabase `users`テーブルへのユーザーレコード作成
5. 2回目以降のアクセスでは名前入力をスキップ

## ゴール / 完了条件（Acceptance Criteria）

- [ ] 初回アクセス時に名前入力ダイアログ表示（shadcn/ui Dialog）
- [ ] 名前未入力の場合は「ゲスト」として扱う
- [ ] ローカルストレージにランダムUUID生成・保存（`user_id`キー）
- [ ] `/lib/user.ts`にユーザーID取得ヘルパー関数作成（`getUserId()`, `getUserName()`）
- [ ] Supabase `users`テーブルに初回アクセス時にユーザーレコード作成（`id: UUID`, `name: 入力値`）
- [ ] 2回目以降のアクセスでは名前入力をスキップ

## テスト観点

- **初回アクセス**: ブラウザのシークレットモードで開き、名前入力ダイアログが表示されること
- **UUID保存**: ローカルストレージに`user_id`が保存されること
- **ユーザーレコード作成**: Supabase `users`テーブルに新規ユーザーが作成されること
- **2回目以降**: 通常モードで再アクセスし、名前入力ダイアログが表示されないこと
- **ゲスト扱い**: 名前未入力で進めた場合、`name: "ゲスト"`として保存されること

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# ブラウザでアクセス
# 1. シークレットモードで http://localhost:3000 を開く
# 2. 名前入力ダイアログが表示されることを確認
# 3. 名前を入力して「次へ」ボタンをクリック
# 4. ローカルストレージに`user_id`が保存されることを確認（DevTools > Application > Local Storage）
# 5. Supabase管理画面で`users`テーブルに新規ユーザーが作成されることを確認
# 6. ページをリロードし、名前入力ダイアログが表示されないことを確認
```

## 実装例

### /lib/user.ts

```typescript
import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'user_id';
const USER_NAME_KEY = 'user_name';

export function getUserId(): string {
  if (typeof window === 'undefined') return '';

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function getUserName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USER_NAME_KEY) || '';
}

export function setUserName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_NAME_KEY, name || 'ゲスト');
}

export function hasUser(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(USER_ID_KEY);
}
```

### /components/user-setup-dialog.tsx

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getUserId, setUserName, hasUser } from '@/lib/user';

export function UserSetupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!hasUser()) {
      setOpen(true);
    }
  }, []);

  const handleSubmit = async () => {
    const userId = getUserId();
    setUserName(name);

    // Supabase users テーブルに保存
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, name: name || 'ゲスト' }),
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ようこそ！</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="お名前を入力してください（任意）"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={handleSubmit}>次へ</Button>
      </DialogContent>
    </Dialog>
  );
}
```

## 要確認事項

- ユーザー名は必須にするか、任意にするか？（現状: 任意、未入力時は「ゲスト」）
- shadcn/ui Dialogコンポーネントはインストール済みか？（未インストールの場合: `pnpm dlx shadcn-ui@latest add dialog`）
