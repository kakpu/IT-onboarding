# Issue #24: 管理ダッシュボード（将来機能）

## 背景 / 目的

管理者向けダッシュボード（`/admin`）を作成し、統計情報を表示する。教育担当者が全体の利用状況と問題箇所を把握できる。

- **依存**: #23
- **ラベル**: frontend, backend, admin

## スコープ / 作業項目

1. `/app/admin/page.tsx`作成（管理ダッシュボード）
2. `/app/api/admin/stats/route.ts`作成（GET /api/admin/stats）
3. ロールベースアクセス制御（`role === 'admin' || role === 'trainer'`）
4. サマリーカード（総ユーザー数、アクティブユーザー数、全体完了率）表示
5. 未解決ランキングTop5表示
6. よく見られている項目Top5表示

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/admin/page.tsx`作成、管理ダッシュボード実装完了
- [ ] `/app/api/admin/stats/route.ts`作成（GET /api/admin/stats）
- [ ] ロールベースアクセス制御（`role === 'admin' || role === 'trainer'`）実装
- [ ] サマリーカード（総ユーザー数、アクティブユーザー数、全体完了率）表示
- [ ] 未解決ランキングTop5表示
- [ ] よく見られている項目Top5表示

## テスト観点

- **アクセス制御**: 管理者・教育担当者のみアクセスできること
- **統計表示**: 総ユーザー数、アクティブユーザー数、全体完了率が正しく表示されること
- **未解決ランキング**: 未解決数が多い項目がTop5で表示されること
- **よく見られている項目**: 閲覧数が多い項目がTop5で表示されること

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# 管理者ユーザーでログイン
# http://localhost:3000/admin

# 一般ユーザーでアクセスすると403エラーになることを確認
```

## 実装例（docs/04_api.md, docs/05_sitemap.md参照）

### /middleware.ts（更新）

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // 管理者ページのアクセス制御
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token || (token.role !== 'admin' && token.role !== 'trainer')) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api/auth|auth/signin|auth/signup|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### /app/api/admin/stats/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 認証・権限チェック
    const session = await requireAuth();
    if (session.user.role !== 'admin' && session.user.role !== 'trainer') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!query.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: query.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 総ユーザー数
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // アクティブユーザー数（過去7日間にログインしたユーザー）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: activeUsers } = await supabase
      .from('activity_logs')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
      .neq('user_id', null);

    // 全体完了率
    const { data: progressData } = await supabase.from('user_progress').select('status');

    const totalProgress = progressData?.length || 0;
    const resolvedProgress = progressData?.filter((p) => p.status === 'resolved').length || 0;
    const completionRate = totalProgress > 0 ? resolvedProgress / totalProgress : 0;

    // 未解決ランキングTop5
    const { data: unresolvedItems } = await supabase
      .from('user_progress')
      .select('checklist_item_id, checklist_items(id, title)')
      .eq('status', 'unresolved');

    const unresolvedCount = new Map<string, { id: string; title: string; count: number }>();
    unresolvedItems?.forEach((item) => {
      const id = item.checklist_item_id;
      const existing = unresolvedCount.get(id);
      if (existing) {
        existing.count++;
      } else {
        unresolvedCount.set(id, {
          id,
          title: (item.checklist_items as any).title,
          count: 1,
        });
      }
    });

    const topUnresolvedItems = Array.from(unresolvedCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        checklistItemId: item.id,
        title: item.title,
        unresolvedCount: item.count,
      }));

    // よく見られている項目Top5
    const { data: viewLogs } = await supabase
      .from('activity_logs')
      .select('checklist_item_id, checklist_items(id, title)')
      .eq('action', 'view')
      .not('checklist_item_id', 'is', null);

    const viewCount = new Map<string, { id: string; title: string; count: number }>();
    viewLogs?.forEach((log) => {
      const id = log.checklist_item_id!;
      const existing = viewCount.get(id);
      if (existing) {
        existing.count++;
      } else {
        viewCount.set(id, {
          id,
          title: (log.checklist_items as any).title,
          count: 1,
        });
      }
    });

    const mostViewedItems = Array.from(viewCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        checklistItemId: item.id,
        title: item.title,
        viewCount: item.count,
      }));

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      completionRate: Math.round(completionRate * 100) / 100,
      topUnresolvedItems,
      mostViewedItems,
    });
  } catch (error) {
    console.error('API Error:', error);
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

### /app/admin/page.tsx

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

async function fetchStats() {
  const res = await fetch('/api/admin/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return <div className="container mx-auto p-4">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-600">エラーが発生しました</p>
      </div>
    );
  }

  const { totalUsers, activeUsers, completionRate, topUnresolvedItems, mostViewedItems } =
    data;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">管理ダッシュボード</h1>

      {/* サマリーカード */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>総ユーザー数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>アクティブユーザー数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeUsers}</p>
            <p className="text-sm text-gray-600">過去7日間</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>全体完了率</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Math.round(completionRate * 100)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 未解決ランキング */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>未解決ランキング Top5</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>項目名</TableHead>
                <TableHead className="text-right">未解決数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUnresolvedItems.map((item: any) => (
                <TableRow key={item.checklistItemId}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell className="text-right">{item.unresolvedCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* よく見られている項目 */}
      <Card>
        <CardHeader>
          <CardTitle>よく見られている項目 Top5</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>項目名</TableHead>
                <TableHead className="text-right">閲覧数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostViewedItems.map((item: any) => (
                <TableRow key={item.checklistItemId}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell className="text-right">{item.viewCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### /app/403/page.tsx（403エラーページ）

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Forbidden() {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">403</h1>
      <p className="text-gray-600 mb-6">このページにアクセスする権限がありません。</p>
      <Link href="/">
        <Button>ホームに戻る</Button>
      </Link>
    </div>
  );
}
```

## 要確認事項

- shadcn/ui Tableコンポーネントはインストール済みか？（未インストールの場合: `pnpm dlx shadcn-ui@latest add table`）
- 管理者ロールの付与方法は？（手動でSupabaseのusersテーブルを更新するか、管理者用の登録フローを作成するか）
