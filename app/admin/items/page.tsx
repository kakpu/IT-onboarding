'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

/** DBから取得するチェックリスト項目の型 */
type ChecklistItem = {
  id: string;
  day: number;
  category: string;
  title: string;
  summary: string;
  steps: string[];
  notes: string | null;
  order_index: number;
  is_active: boolean;
};

/** フォーム入力値の型 */
type ItemFormData = {
  day: string;
  category: string;
  title: string;
  summary: string;
  steps: string;
  notes: string;
  orderIndex: string;
  isActive: boolean;
};

const INITIAL_FORM: ItemFormData = {
  day: '1',
  category: '',
  title: '',
  summary: '',
  steps: '',
  notes: '',
  orderIndex: '0',
  isActive: true,
};

/** 項目一覧を取得する */
async function fetchItems(day: string, status: string): Promise<{ items: ChecklistItem[] }> {
  const params = new URLSearchParams();
  if (day !== 'all') params.set('day', day);
  if (status !== 'all') params.set('status', status);
  const res = await fetch(`/api/admin/items?${params.toString()}`);
  if (!res.ok) throw new Error('項目の取得に失敗しました');
  return res.json();
}

/**
 * 管理者用チェックリスト項目管理ページ
 */
export default function AdminItemsPage() {
  const queryClient = useQueryClient();
  const [dayFilter, setDayFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<ChecklistItem | null>(null);
  const [form, setForm] = useState<ItemFormData>(INITIAL_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-items', dayFilter, statusFilter],
    queryFn: () => fetchItems(dayFilter, statusFilter),
  });

  /** 新規作成 */
  const createMutation = useMutation({
    mutationFn: async (formData: ItemFormData) => {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: parseInt(formData.day),
          category: formData.category,
          title: formData.title,
          summary: formData.summary,
          steps: formData.steps.split('\n').filter((s) => s.trim()),
          notes: formData.notes || undefined,
          orderIndex: parseInt(formData.orderIndex),
          isActive: formData.isActive,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? '作成に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
      toast.success('項目を追加しました');
      setIsCreateOpen(false);
      setForm(INITIAL_FORM);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /** 更新 */
  const updateMutation = useMutation({
    mutationFn: async (formData: ItemFormData) => {
      if (!editItem) return;
      const res = await fetch('/api/admin/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editItem.id,
          day: parseInt(formData.day),
          category: formData.category,
          title: formData.title,
          summary: formData.summary,
          steps: formData.steps.split('\n').filter((s) => s.trim()),
          notes: formData.notes || undefined,
          orderIndex: parseInt(formData.orderIndex),
          isActive: formData.isActive,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? '更新に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
      toast.success('項目を更新しました');
      setEditItem(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /** 論理削除 */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/items?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? '削除に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
      toast.success('項目を無効化しました');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /** 編集ダイアログを開く */
  const handleEditOpen = (item: ChecklistItem) => {
    setEditItem(item);
    setForm({
      day: String(item.day),
      category: item.category,
      title: item.title,
      summary: item.summary,
      steps: item.steps.join('\n'),
      notes: item.notes ?? '',
      orderIndex: String(item.order_index),
      isActive: item.is_active,
    });
  };

  const items = data?.items ?? [];

  return (
    <div className="container mx-auto p-4">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">
            ← 管理ダッシュボード
          </Link>
          <h1 className="mt-1 text-2xl font-bold">項目管理</h1>
        </div>

        {/* 新規追加ダイアログ */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(INITIAL_FORM)}>新規項目追加</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規項目追加</DialogTitle>
            </DialogHeader>
            <ItemForm
              form={form}
              onChange={setForm}
              onSubmit={() => createMutation.mutate(form)}
              isLoading={createMutation.isPending}
              submitLabel="追加"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* フィルター */}
      <div className="mb-4 flex gap-3">
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Day選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのDay</SelectItem>
            <SelectItem value="1">Day1</SelectItem>
            <SelectItem value="2">Day2</SelectItem>
            <SelectItem value="3">Day3</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
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
      {isLoading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">項目がありません</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Day</TableHead>
                <TableHead className="w-24">カテゴリ</TableHead>
                <TableHead>タイトル</TableHead>
                <TableHead className="w-16 text-center">表示順</TableHead>
                <TableHead className="w-16 text-center">状態</TableHead>
                <TableHead className="w-28 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={item.is_active ? '' : 'opacity-50'}>
                  <TableCell>Day{item.day}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.title}</TableCell>
                  <TableCell className="text-center">{item.order_index}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        item.is_active
                          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'
                          : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500'
                      }
                    >
                      {item.is_active ? '有効' : '無効'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {/* 編集ダイアログ */}
                      <Dialog
                        open={editItem?.id === item.id}
                        onOpenChange={(open) => !open && setEditItem(null)}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => handleEditOpen(item)}>
                            編集
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>項目編集</DialogTitle>
                          </DialogHeader>
                          <ItemForm
                            form={form}
                            onChange={setForm}
                            onSubmit={() => updateMutation.mutate(form)}
                            isLoading={updateMutation.isPending}
                            submitLabel="更新"
                          />
                        </DialogContent>
                      </Dialog>

                      {/* 論理削除ボタン（有効な項目のみ表示） */}
                      {item.is_active && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          無効化
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/** 項目追加・編集フォームコンポーネント */
function ItemForm({
  form,
  onChange,
  onSubmit,
  isLoading,
  submitLabel,
}: {
  form: ItemFormData;
  onChange: (form: ItemFormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  const update = (field: keyof ItemFormData, value: string | boolean) =>
    onChange({ ...form, [field]: value });

  return (
    <div className="space-y-4">
      {/* Day選択 */}
      <div className="space-y-1">
        <Label>Day</Label>
        <Select value={form.day} onValueChange={(v) => update('day', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Day1</SelectItem>
            <SelectItem value="2">Day2</SelectItem>
            <SelectItem value="3">Day3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* カテゴリ */}
      <div className="space-y-1">
        <Label>カテゴリ</Label>
        <Input
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
          placeholder="例: login, m365, teams"
          maxLength={50}
        />
      </div>

      {/* タイトル */}
      <div className="space-y-1">
        <Label>タイトル</Label>
        <Input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="項目のタイトル"
          maxLength={200}
        />
      </div>

      {/* 概要 */}
      <div className="space-y-1">
        <Label>概要（結論）</Label>
        <Textarea
          value={form.summary}
          onChange={(e) => update('summary', e.target.value)}
          placeholder="この項目で何をするか1文で説明"
          rows={2}
        />
      </div>

      {/* 手順 */}
      <div className="space-y-1">
        <Label>手順（1行1ステップ）</Label>
        <Textarea
          value={form.steps}
          onChange={(e) => update('steps', e.target.value)}
          placeholder={'1. PCの電源を入れる\n2. ログインする\n3. 設定を開く'}
          rows={5}
        />
      </div>

      {/* 注意点 */}
      <div className="space-y-1">
        <Label>注意点（任意）</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="ユーザーへの注意点"
          rows={2}
        />
      </div>

      {/* 表示順 */}
      <div className="space-y-1">
        <Label>表示順</Label>
        <Input
          type="number"
          value={form.orderIndex}
          onChange={(e) => update('orderIndex', e.target.value)}
          min={0}
        />
      </div>

      {/* 有効/無効 */}
      <div className="space-y-1">
        <Label>ステータス</Label>
        <Select
          value={form.isActive ? 'active' : 'inactive'}
          onValueChange={(v) => update('isActive', v === 'active')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">有効</SelectItem>
            <SelectItem value="inactive">無効</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={isLoading}>
        {isLoading ? '処理中...' : submitLabel}
      </Button>
    </div>
  );
}
