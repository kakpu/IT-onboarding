# Issue #26: ユーザー管理（将来機能）

## 背景 / 目的

管理者がユーザー一覧を確認し、ロール変更できるページを実装する。これにより、教育担当者や管理者の権限を付与できる。

- **依存**: #24
- **ラベル**: frontend, backend, admin

## スコープ / 作業項目

1. `/app/admin/users/page.tsx`作成（ユーザー一覧ページ）
2. `/app/api/admin/users/route.ts`作成（GET, PUT）
3. ユーザー一覧テーブル表示
4. ロール変更ドロップダウン
5. 検索バー（名前、メールアドレス）実装
6. ページネーション実装（1ページ50人）

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/admin/users/page.tsx`作成、ユーザー一覧ページ実装完了
- [ ] `/app/api/admin/users/route.ts`作成（GET, PUT）
- [ ] ユーザー一覧テーブル（名前、メールアドレス、入社日、ロール、進捗率）表示
- [ ] ロール変更ドロップダウン（user, trainer, admin）実装
- [ ] 検索バー（名前、メールアドレス）実装
- [ ] ページネーション実装（1ページ50人）

## テスト観点

- **一覧表示**: ユーザー一覧が正しく表示されること
- **ロール変更**: ロール変更が正常に動作すること
- **検索**: 名前・メールアドレスで検索できること
- **ページネーション**: ページネーションが正常に動作すること
- **進捗率**: 各ユーザーの進捗率が正しく表示されること

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# 管理者ユーザーでログイン
# http://localhost:3000/admin/users

# ロール変更を実行
# Supabase管理画面でusersテーブルを確認
```

## 実装例

### /app/api/admin/users/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== 'admin' && session.user.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
    });

    if (!query.success) {
      return NextResponse.json(
        { error: 'Validation error', details: query.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search } = query.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const supabase = createClient();

    // ユーザー一覧取得
    let usersQuery = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // 検索フィルター
    if (search) {
      usersQuery = usersQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await usersQuery;

    if (error) throw error;

    // 各ユーザーの進捗率を計算
    const usersWithProgress = await Promise.all(
      (users || []).map(async (user) => {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('status')
          .eq('user_id', user.id);

        const total = progressData?.length || 0;
        const resolved = progressData?.filter((p) => p.status === 'resolved').length || 0;
        const progressRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        return {
          ...user,
          progressRate,
        };
      })
    );

    return NextResponse.json({
      users: usersWithProgress,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'trainer', 'admin']),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.issues },
        { status: 400 }
      );
    }

    const { id, role } = result.data;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### /app/admin/users/page.tsx

```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

async function fetchUsers(page: number, search: string) {
  const res = await fetch(`/api/admin/users?page=${page}&search=${search}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => fetchUsers(page, search),
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('ロールを更新しました');
    },
  });

  if (isLoading) {
    return <div className="container mx-auto p-4">読み込み中...</div>;
  }

  const { users, pagination } = data || { users: [], pagination: {} };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">ユーザー管理</h1>

      {/* 検索バー */}
      <div className="mb-6">
        <Input
          placeholder="名前・メールアドレスで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* ユーザー一覧テーブル */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>入社日</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>進捗率</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.joinDate || '-'}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) => updateRole.mutate({ id: user.id, role: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">一般</SelectItem>
                    <SelectItem value="trainer">教育担当</SelectItem>
                    <SelectItem value="admin">管理者</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{user.progressRate}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ページネーション */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-600">
          {pagination.total}人中 {(page - 1) * 50 + 1}-{Math.min(page * 50, pagination.total)}人を表示
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            前へ
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## 要確認事項

- ユーザーの削除機能は必要か？（推奨: 論理削除のみ、物理削除は危険）
- ユーザーのインポート機能（CSV等）は必要か？（将来機能）
