import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

/**
 * チェックリスト項目取得APIのクエリパラメータスキーマ
 */
const ChecklistItemsQuerySchema = z.object({
  day: z.enum(['1', '2', '3']).transform(Number),
});

/**
 * チェックリスト項目を取得するGET API
 * @param request - Next.js Request
 * @returns チェックリスト項目の配列
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '認証が必要です' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day');

    // バリデーション
    const result = ChecklistItemsQuerySchema.safeParse({ day });

    if (!result.success) {
      return Response.json(
        { error: 'day パラメータは 1, 2, 3 のいずれかを指定してください' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // チェックリスト項目を取得（有効なもののみ、order_indexで昇順）
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('day', result.data.day)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('チェックリスト項目の取得に失敗しました:', error);
      return Response.json({ error: 'チェックリスト項目の取得に失敗しました' }, { status: 500 });
    }

    return Response.json({ items: data });
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}
