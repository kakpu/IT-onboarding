import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * ユーザー作成リクエストのスキーマ
 */
const CreateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
});

/**
 * ユーザー作成API
 * 初回アクセス時に呼び出され、Supabase usersテーブルに新規ユーザーを作成
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = CreateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: result.error.issues },
        { status: 400 }
      );
    }

    const { id, name } = result.data;
    const supabase = await createClient();

    // 簡易ユーザー識別機能用のダミー値
    // 後でEntra ID認証に移行する際に、実際の値に置き換える
    const email = `${id}@guest.local`;
    const entraId = `guest_${id}`;

    // ユーザーレコード作成
    const { data, error } = await supabase
      .from('users')
      .insert({
        id,
        email,
        name,
        entra_id: entraId,
        role: 'user',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create user:', error);
      return NextResponse.json({ error: 'ユーザー作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
