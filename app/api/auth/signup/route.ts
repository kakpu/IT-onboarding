import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/** ユーザー登録リクエストのバリデーションスキーマ */
const SignupSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
});

/**
 * ユーザー登録API
 * メールアドレス＋パスワードで新規ユーザーを作成
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: result.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const supabase = await createClient();

    // メールアドレスの重複チェック
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // パスワードのハッシュ化
    const passwordHash = await hash(password, 12);

    // ユーザー作成
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        role: 'user',
      })
      .select('id, email, name')
      .single();

    if (error) {
      console.error('ユーザー作成に失敗しました:', error);
      return NextResponse.json({ error: 'ユーザー作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error('サーバーエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
