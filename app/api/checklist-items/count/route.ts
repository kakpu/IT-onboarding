import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

/**
 * Day別のチェックリスト項目数を取得するGET API
 * @returns [{ day: 1, count: 5 }, { day: 2, count: 6 }, { day: 3, count: 5 }]
 */
export async function GET() {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '認証が必要です' }, { status: 401 });
    }
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('checklist_items')
      .select('id, day')
      .eq('is_active', true);

    if (error) {
      console.error('項目数の取得に失敗しました:', error);
      return Response.json({ error: '項目数の取得に失敗しました' }, { status: 500 });
    }

    // Day別にカウントし、各アイテムのIDも返す
    const dayMap = new Map<number, string[]>();
    for (const item of data || []) {
      const ids = dayMap.get(item.day) || [];
      ids.push(item.id);
      dayMap.set(item.day, ids);
    }

    const result = Array.from(dayMap.entries()).map(([day, ids]) => ({
      day,
      count: ids.length,
      itemIds: ids,
    }));

    return Response.json(result);
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}
