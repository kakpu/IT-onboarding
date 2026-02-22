# Issue #23: エラー監視・ログ設定

## 背景 / 目的

Vercel Analyticsを導入し、エラートラッキング・パフォーマンス監視を設定する。これにより、本番環境でのエラーやパフォーマンス問題を早期に発見できる。

- **依存**: #22
- **ラベル**: infrastructure, monitoring

## スコープ / 作業項目

1. Vercel Analytics導入
2. `app/layout.tsx`にAnalyticsコンポーネント追加
3. Vercel Speed Insights有効化
4. エラーログ記録（Next.js標準のconsole.error）
5. 本番環境でエラートラッキング動作確認
6. Vercelダッシュボードで統計確認

## ゴール / 完了条件（Acceptance Criteria）

- [ ] Vercel Analytics導入（`@vercel/analytics`パッケージ）
- [ ] `app/layout.tsx`にAnalyticsコンポーネント追加
- [ ] Vercel Speed Insights有効化（`@vercel/speed-insights`パッケージ）
- [ ] エラーログ記録（Next.js標準のconsole.error）
- [ ] 本番環境でエラートラッキング動作確認
- [ ] Vercelダッシュボードで統計確認（アクセス数、エラー数、パフォーマンス）

## テスト観点

- **Analytics動作確認**: Vercelダッシュボードでページビューが記録されること
- **Speed Insights動作確認**: Core Web Vitalsが記録されること
- **エラートラッキング**: 本番環境でエラーが発生した場合、ログが記録されること
- **パフォーマンス**: ページロード時間、FCP、LCPが記録されること

### 検証方法

```bash
# Vercel Analytics導入
pnpm add @vercel/analytics @vercel/speed-insights

# 開発サーバー起動（本番環境でのみ有効）
pnpm build
pnpm start

# Vercelにデプロイ
vercel --prod

# Vercelダッシュボードでアクセス
# https://vercel.com/{YOUR_TEAM}/it-onboarding/analytics
```

## 実装例

### パッケージ導入

```bash
pnpm add @vercel/analytics @vercel/speed-insights
```

### /app/layout.tsx（更新）

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Providers } from './providers';
import { UserSetupDialog } from '@/components/user-setup-dialog';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

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
      <body>
        <Providers>
          <header className="border-b">
            <div className="container mx-auto p-4">
              <h1 className="text-xl font-bold">ITオンボーディング</h1>
            </div>
          </header>
          <main className="min-h-screen">{children}</main>
          <footer className="border-t">
            <div className="container mx-auto p-4 text-center text-sm text-gray-600">
              © 2024 IT-onboarding
            </div>
          </footer>
          <UserSetupDialog />
          <Toaster />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### エラーログ記録

#### /app/error.tsx（更新）

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
    // エラーログを記録
    console.error('Application Error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });

    // 本番環境では外部サービスにエラーを送信（オプション）
    if (process.env.NODE_ENV === 'production') {
      // 例: Sentryにエラーを送信
      // Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
      <p className="text-gray-600 mb-6">
        申し訳ございません。予期しないエラーが発生しました。
      </p>
      <p className="text-sm text-gray-500 mb-6">
        エラーID: {error.digest}
      </p>
      <Button onClick={reset}>再試行</Button>
    </div>
  );
}
```

### API Routeエラーログ

#### /app/api/\*/route.ts（共通パターン）

```typescript
export async function GET(request: NextRequest) {
  try {
    // ... ビジネスロジック ...
  } catch (error) {
    // エラーログを記録
    console.error('API Error:', {
      path: request.url,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
```

## Vercel Analytics機能

### 1. ページビュー分析

- ページごとのアクセス数
- ユニークユーザー数
- 平均滞在時間

### 2. Core Web Vitals

- **LCP (Largest Contentful Paint)**: ページの主要コンテンツが表示されるまでの時間
- **FID (First Input Delay)**: ユーザーが最初にインタラクションしてから反応するまでの時間
- **CLS (Cumulative Layout Shift)**: レイアウトの安定性

### 3. デバイス・ブラウザ分析

- デバイス別（モバイル、タブレット、デスクトップ）
- ブラウザ別（Chrome, Safari, Firefox等）
- OS別（iOS, Android, Windows等）

## Vercel Speed Insights機能

### リアルユーザーモニタリング（RUM）

- 実際のユーザーのパフォーマンスデータを収集
- 地域別のパフォーマンス分析
- ページごとのパフォーマンススコア

## エラー監視の拡張（オプション）

より高度なエラー監視が必要な場合、Sentryの導入を検討:

```bash
pnpm add @sentry/nextjs
```

### /sentry.client.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

## Vercelダッシュボードでの確認手順

1. Vercelダッシュボードにログイン
2. プロジェクト（`it-onboarding`）を選択
3. **Analytics**タブをクリック
   - ページビュー、ユニークユーザー、平均滞在時間を確認
4. **Speed Insights**タブをクリック
   - Core Web Vitals（LCP, FID, CLS）を確認
5. **Logs**タブをクリック
   - エラーログ、アクセスログを確認

## 要確認事項

- Vercel Analytics（無料枠）で十分か？有料プラン（Analytics Pro: $10/月）が必要か？
- Sentryなど外部エラー監視サービスは必要か？（推奨: まずはVercel標準機能で様子を見る）
