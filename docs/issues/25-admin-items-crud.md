# Issue #25: 項目管理CRUD（将来機能）

## 背景 / 目的

管理者がチェックリスト項目をCRUD操作できるページを実装する。これにより、手順の追加・編集・削除が管理画面から行える。

- **依存**: #24
- **ラベル**: frontend, backend, admin

## スコープ / 作業項目

1. `/app/admin/items/page.tsx`作成（項目一覧ページ）
2. `/app/api/admin/items/route.ts`作成（POST, PUT, DELETE）
3. 項目一覧テーブル表示
4. 新規項目追加フォーム
5. 項目編集・削除機能
6. Dayフィルター、ステータスフィルター実装

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `/app/admin/items/page.tsx`作成、項目一覧ページ実装完了
- [ ] `/app/api/admin/items/route.ts`作成（POST, PUT, DELETE）
- [ ] 項目一覧テーブル（Day、カテゴリ、タイトル、表示順、有効/無効）表示
- [ ] 新規項目追加フォーム（Zodバリデーション）実装
- [ ] 項目編集・削除機能実装
- [ ] Dayフィルター、ステータスフィルター実装

## テスト観点

- **一覧表示**: チェックリスト項目が一覧表示されること
- **新規追加**: 新規項目が正しく追加されること
- **編集**: 項目が正しく編集されること
- **削除**: 項目が正しく削除されること（論理削除: `is_active = false`）
- **フィルター**: Dayフィルター、ステータスフィルターが正常に動作すること

### 検証方法

```bash
# 開発サーバー起動
pnpm dev

# 管理者ユーザーでログイン
# http://localhost:3000/admin/items

# 新規項目を追加
# 編集・削除を実行
# Supabase管理画面でchecklist_itemsテーブルを確認
```

## 実装例

### /app/api/admin/items/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

const itemSchema = z.object({
  day: z.number().int().min(1).max(3),
  category: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  summary: z.string().min(1),
  steps: z.array(z.string()),
  notes: z.string().optional(),
  orderIndex: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== 'admin' && session.user.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = itemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.issues },
        { status: 400 }
      );
    }

    const { day, category, title, summary, steps, notes, orderIndex, isActive } = result.data;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        day,
        category,
        title,
        summary,
        steps,
        notes: notes || null,
        order_index: orderIndex,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== 'admin' && session.user.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    const result = itemSchema.partial().safeParse(updateData);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.issues },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('checklist_items')
      .update({
        ...result.data,
        order_index: result.data.orderIndex,
        is_active: result.data.isActive,
        updated_at: new Date().toISOString(),
      })
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== 'admin' && session.user.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const supabase = createClient();
    // 論理削除（is_active = false）
    const { error } = await supabase
      .from('checklist_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### /app/admin/items/page.tsx

```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

async function fetchItems() {
  const res = await fetch('/api/checklist-items');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function AdminItemsPage() {
  const queryClient = useQueryClient();
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-items'],
    queryFn: fetchItems,
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/items?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
      toast.success('項目を削除しました');
    },
  });

  if (isLoading) {
    return <div className="container mx-auto p-4">読み込み中...</div>;
  }

  const items = data?.items || [];

  // フィルタリング
  const filteredItems = items.filter((item: any) => {
    if (dayFilter !== 'all' && item.day !== parseInt(dayFilter)) return false;
    if (statusFilter === 'active' && !item.isActive) return false;
    if (statusFilter === 'inactive' && item.isActive) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">項目管理</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>新規項目追加</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規項目追加</DialogTitle>
            </DialogHeader>
            {/* フォーム実装 */}
          </DialogContent>
        </Dialog>
      </div>

      {/* フィルター */}
      <div className="flex gap-4 mb-6">
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Day選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="1">Day1</SelectItem>
            <SelectItem value="2">Day2</SelectItem>
            <SelectItem value="3">Day3</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="active">有効</SelectItem>
            <SelectItem value="inactive">無効</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 項目一覧テーブル */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead>タイトル</TableHead>
            <TableHead>表示順</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item: any) => (
            <TableRow key={item.id}>
              <TableCell>Day{item.day}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.title}</TableCell>
              <TableCell>{item.orderIndex}</TableCell>
              <TableCell>{item.isActive ? '有効' : '無効'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    編集
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteItem.mutate(item.id)}
                  >
                    削除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## 要確認事項

- shadcn/ui Select, Dialog, Textareaコンポーネントはインストール済みか？
- 項目の並び順変更（ドラッグ&ドロップ）は必要か？（将来機能として後で実装可能）
