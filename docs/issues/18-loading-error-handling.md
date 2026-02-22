# Issue #18: ローディング・エラーハンドリング

## 背景 / 目的

全ページにローディング状態、エラー状態のUIを実装する。これにより、ユーザーがデータ取得中やエラー発生時に適切なフィードバックを得られる。

- **依存**: #17
- **ラベル**: frontend, ui

## スコープ / 作業項目

1. `/app/loading.tsx`作成（スケルトンスクリーン）
2. `/app/error.tsx`作成（エラーバウンダリ）
3. React Queryでローディング・エラー状態を管理
4. APIエラー時にトースト通知表示
5. 404ページ、500ページのカスタムデザイン

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/loading.tsx`作成、スケルトンスクリーン表示
- [ ] `/app/error.tsx`作成、エラーバウンダリ実装
- [ ] React Queryでローディング・エラー状態を管理
- [ ] APIエラー時にトースト通知表示
- [ ] 404ページ（`/app/not-found.tsx`）カスタムデザイン
- [ ] 500ページ（`/app/error.tsx`）に再試行ボタン追加

## テスト観点

- **ローディング表示**: データ取得中にスケルトンスクリーンが表示されること
- **エラー表示**: API呼び出しが失敗した場合、エラーメッセージが表示されること
- **再試行機能**: エラー画面の再試行ボタンをクリックすると、ページがリロードされること
- **404ページ**: 存在しないURLにアクセスすると、404ページが表示されること
- **トースト通知**: API呼び出しが失敗した場合、トースト通知が表示されること

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# ローディング確認（ネットワークをSlowに設定）
# DevTools > Network > Throttling > Slow 3G

# エラー確認（Supabaseを停止）
pnpm exec supabase stop

# 404ページ確認
# http://localhost:3000/invalid-url

# 500ページ確認（APIで意図的にエラーを発生させる）
```

## 実装例

### /app/loading.tsx

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-4 w-48 mb-6" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
```

### /app/error.tsx

```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
      <p className="text-gray-600 mb-6">
        申し訳ございません。予期しないエラーが発生しました。
      </p>
      <Button onClick={reset}>再試行</Button>
    </div>
  );
}
```

### /app/not-found.tsx

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-gray-600 mb-6">
        お探しのページが見つかりませんでした。
      </p>
      <Link href="/">
        <Button>ホームに戻る</Button>
      </Link>
    </div>
  );
}
```

### React Queryエラーハンドリング

#### /app/providers.tsx（更新）

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { toast } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
            onError: (error: any) => {
              toast.error(
                error?.message || 'データの取得に失敗しました'
              );
            },
          },
          mutations: {
            onError: (error: any) => {
              toast.error(
                error?.message || '処理に失敗しました'
              );
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### スケルトンスクリーン（Day一覧ページ）

#### /app/day/[id]/loading.tsx

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export default function DayLoading() {
  return (
    <div className="container mx-auto p-4">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-4 w-48 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
```

### API呼び出しエラーハンドリング例

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['progress', userId],
  queryFn: () => fetchProgress(userId),
  enabled: !!userId,
});

if (isLoading) {
  return <Loading />;
}

if (error) {
  return (
    <div className="container mx-auto p-4">
      <p className="text-red-600">
        エラーが発生しました: {error.message}
      </p>
    </div>
  );
}
```

## 要確認事項

- shadcn/ui Skeletonコンポーネントはインストール済みか？（未インストールの場合: `pnpm dlx shadcn-ui@latest add skeleton`）
- エラーログは外部サービス（Sentry等）に送信するか？（Issue #23で対応）
