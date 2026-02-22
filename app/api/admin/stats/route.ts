import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

/**
 * 管理ダッシュボード統計API
 * admin/trainerロールのみアクセス可能
 * @returns 統計データ（総ユーザー数、アクティブユーザー数、完了率、ランキング）
 */
export async function GET() {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ロールチェック
    const role = (session.user as { role?: string }).role;
    if (role !== 'admin' && role !== 'trainer') {
      return Response.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const supabase = await createClient();

    // 総ユーザー数
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // アクティブユーザー数（過去7日間のユニークユーザー）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activeLogs } = await supabase
      .from('activity_logs')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString());

    const activeUserIds = new Set(activeLogs?.map((log) => log.user_id));
    const activeUsers = activeUserIds.size;

    // 全体完了率
    const { data: progressData } = await supabase.from('user_progress').select('status');

    const totalProgress = progressData?.length || 0;
    const resolvedProgress = progressData?.filter((p) => p.status === 'resolved').length || 0;
    const completionRate =
      totalProgress > 0 ? Math.round((resolvedProgress / totalProgress) * 100) / 100 : 0;

    // 未解決ランキングTop5
    const { data: unresolvedItems } = await supabase
      .from('user_progress')
      .select('checklist_item_id')
      .eq('status', 'unresolved');

    const unresolvedCount = new Map<string, number>();
    unresolvedItems?.forEach((item) => {
      unresolvedCount.set(
        item.checklist_item_id,
        (unresolvedCount.get(item.checklist_item_id) || 0) + 1
      );
    });

    const topUnresolvedIds = Array.from(unresolvedCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // チェックリスト項目のタイトルを取得
    const itemIds = [...new Set([...topUnresolvedIds.map(([id]) => id)])];

    // よく見られている項目Top5
    const { data: viewLogs } = await supabase
      .from('activity_logs')
      .select('checklist_item_id')
      .eq('action', 'view')
      .not('checklist_item_id', 'is', null);

    const viewCount = new Map<string, number>();
    viewLogs?.forEach((log) => {
      if (log.checklist_item_id) {
        viewCount.set(log.checklist_item_id, (viewCount.get(log.checklist_item_id) || 0) + 1);
      }
    });

    const topViewedIds = Array.from(viewCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // タイトル取得用のID一覧
    const allItemIds = [...new Set([...itemIds, ...topViewedIds.map(([id]) => id)])];

    const titleMap = new Map<string, string>();
    if (allItemIds.length > 0) {
      const { data: items } = await supabase
        .from('checklist_items')
        .select('id, title')
        .in('id', allItemIds);

      items?.forEach((item) => {
        titleMap.set(item.id, item.title);
      });
    }

    const topUnresolvedItems = topUnresolvedIds.map(([id, count]) => ({
      checklistItemId: id,
      title: titleMap.get(id) || '不明な項目',
      count,
    }));

    const mostViewedItems = topViewedIds.map(([id, count]) => ({
      checklistItemId: id,
      title: titleMap.get(id) || '不明な項目',
      count,
    }));

    return Response.json({
      totalUsers: totalUsers || 0,
      activeUsers,
      completionRate,
      topUnresolvedItems,
      mostViewedItems,
    });
  } catch (error) {
    console.error('統計データの取得に失敗しました:', error);
    return Response.json({ error: '統計データの取得に失敗しました' }, { status: 500 });
  }
}
