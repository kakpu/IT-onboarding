'use client';

import Link from 'next/link';
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
import type { AdminStats } from '@/lib/types';

/**
 * 統計データを取得する
 */
async function fetchStats(): Promise<AdminStats> {
  const res = await fetch('/api/admin/stats');
  if (!res.ok) throw new Error('統計データの取得に失敗しました');
  return res.json();
}

/**
 * 管理ダッシュボードページ
 * admin/trainerロールのみアクセス可能（ミドルウェアで制御）
 */
export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold">管理ダッシュボード</h1>
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold">管理ダッシュボード</h1>
        <p className="text-red-600">エラーが発生しました</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">管理ダッシュボード</h1>
        <Link
          href="/admin/items"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          項目管理
        </Link>
      </div>

      {/* サマリーカード */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">総ユーザー数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              アクティブユーザー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.activeUsers}</p>
            <p className="text-sm text-gray-500">過去7日間</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">全体完了率</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Math.round(data.completionRate * 100)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 未解決ランキング */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>未解決ランキング Top5</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topUnresolvedItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>項目名</TableHead>
                  <TableHead className="w-[100px] text-right">未解決数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topUnresolvedItems.map((item) => (
                  <TableRow key={item.checklistItemId}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-gray-500">データがありません</p>
          )}
        </CardContent>
      </Card>

      {/* よく見られている項目 */}
      <Card>
        <CardHeader>
          <CardTitle>よく見られている項目 Top5</CardTitle>
        </CardHeader>
        <CardContent>
          {data.mostViewedItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>項目名</TableHead>
                  <TableHead className="w-[100px] text-right">閲覧数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.mostViewedItems.map((item) => (
                  <TableRow key={item.checklistItemId}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-gray-500">データがありません</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
