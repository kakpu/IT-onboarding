import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

/**
 * 自分の進捗一覧を取得するGET API
 * セッションからユーザーIDを取得するため、URLにuserIdを含める必要がない
 * @returns ユーザーの全進捗データ
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
      .from('user_progress')
      .select('checklist_item_id, status, resolved_at, notes')
      .eq('user_id', session.user.id);

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
