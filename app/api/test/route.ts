import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase接続テスト用API Route
 * checklist_itemsテーブルから1件のデータを取得してレスポンスを返す
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('checklist_items').select('*').limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase接続成功',
      data,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
