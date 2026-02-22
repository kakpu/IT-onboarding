import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

/**
 * ユーザーの進捗一覧を取得するGET API
 * @param request - Next.js Request
 * @param params - Dynamic route params (userId)
 * @returns ユーザーの全進捗データ
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { userId } = await params;

    // 自分のデータのみアクセス可能
    if (userId !== session.user.id) {
      return Response.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_progress')
      .select('checklist_item_id, status, resolved_at, notes')
      .eq('user_id', userId);

    if (error) {
      console.error('進捗の取得に失敗しました:', error);
      return Response.json({ error: '進捗の取得に失敗しました' }, { status: 500 });
    }

    return Response.json(data || []);
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}
