'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { useSession } from 'next-auth/react';

/** APIレスポンスのユーザー型 */
type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'trainer' | 'admin';
  department: string | null;
  join_date: string | null;
  progressRate: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type UsersResponse = {
  users: AdminUser[];
  pagination: Pagination;
};

const ROLE_LABELS: Record<string, string> = {
  user: '一般',
  trainer: '教育担当',
  admin: '管理者',
};

async function fetchUsers(page: number, search: string): Promise<UsersResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set('search', search);
  const res = await fetch(`/api/admin/users?${params.toString()}`);
  if (!res.ok) throw new Error('ユーザー一覧の取得に失敗しました');
  return res.json();
}

/**
 * 管理者用ユーザー管理ページ
 * admin/trainerロールがアクセス可能（ロール変更はadminのみ）
 */
export default function AdminUsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  /** 検索確定（Enterキー or ボタン） */
  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => fetchUsers(page, search),
  });

  /** ロール更新（adminのみ） */
  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'ロールの更新に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('ロールを更新しました');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isAdmin = (session?.user as { role?: string })?.role === 'admin';
  const { users = [], pagination } = data ?? { users: [], pagination: null };

  const startIndex = pagination ? (page - 1) * pagination.limit + 1 : 0;
  const endIndex = pagination ? Math.min(page * pagination.limit, pagination.total) : 0;

  return (
    <div className="container mx-auto p-4">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">
            ← 管理ダッシュボード
          </Link>
          <h1 className="mt-1 text-2xl font-bold">ユーザー管理</h1>
        </div>
      </div>

      {/* 検索バー */}
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="名前・メールアドレスで検索"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleSearch}>
          検索
        </Button>
        {search && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
          >
            クリア
          </Button>
        )}
      </div>

      {/* ユーザー一覧テーブル */}
      {isLoading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">ユーザーが見つかりませんでした</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead className="w-24">入社日</TableHead>
                  <TableHead className="w-36">ロール</TableHead>
                  <TableHead className="w-20 text-center">進捗率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                    <TableCell className="text-sm">
                      {user.join_date ? new Date(user.join_date).toLocaleDateString('ja-JP') : '-'}
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        /* adminはドロップダウンでロール変更可 */
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateRole.mutate({ id: user.id, role: value })}
                          disabled={updateRole.isPending}
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
                      ) : (
                        /* trainerは表示のみ */
                        <span className="text-sm">{ROLE_LABELS[user.role] ?? user.role}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          user.progressRate === 100
                            ? 'font-semibold text-green-600'
                            : 'text-gray-700'
                        }
                      >
                        {user.progressRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {pagination.total}人中 {startIndex}〜{endIndex}人を表示
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  前へ
                </Button>
                <span className="flex items-center px-2 text-sm text-gray-600">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
