import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { ItemCreateSchema, ItemUpdateSchema } from '@/lib/schemas';

/** admin/trainerロールチェック */
async function requireAdminOrTrainer() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: '認証が必要です', status: 401 };
  }
  const role = (session.user as { role?: string })?.role;
  if (role !== 'admin' && role !== 'trainer') {
    return { error: 'アクセス権限がありません', status: 403 };
  }
  return { session };
}

/**
 * 管理者用チェックリスト項目一覧取得
 * クエリパラメータ: day=1|2|3, status=active|inactive
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminOrTrainer();
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day');
    const status = searchParams.get('status');

    const supabase = await createClient();
    let query = supabase.from('checklist_items').select('*').order('day').order('order_index');

    if (day && ['1', '2', '3'].includes(day)) {
      query = query.eq('day', parseInt(day));
    }
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data, error } = await query;

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

/**
 * 管理者用チェックリスト項目新規作成
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminOrTrainer();
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const result = ItemCreateSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: 'バリデーションエラー', details: result.error.issues },
        { status: 400 }
      );
    }

    const { day, category, title, summary, steps, notes, orderIndex, isActive } = result.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        day,
        category,
        title,
        summary,
        steps,
        notes: notes ?? null,
        order_index: orderIndex,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      console.error('チェックリスト項目の作成に失敗しました:', error);
      return Response.json({ error: 'チェックリスト項目の作成に失敗しました' }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}

/**
 * 管理者用チェックリスト項目更新
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminOrTrainer();
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const result = ItemUpdateSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: 'バリデーションエラー', details: result.error.issues },
        { status: 400 }
      );
    }

    const { id, orderIndex, isActive, ...rest } = result.data;

    // camelCase → snake_case のマッピング
    const updatePayload: Record<string, unknown> = {
      ...rest,
      updated_at: new Date().toISOString(),
    };
    if (orderIndex !== undefined) updatePayload.order_index = orderIndex;
    if (isActive !== undefined) updatePayload.is_active = isActive;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('checklist_items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('チェックリスト項目の更新に失敗しました:', error);
      return Response.json({ error: 'チェックリスト項目の更新に失敗しました' }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}

/**
 * 管理者用チェックリスト項目論理削除（is_active = false）
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminOrTrainer();
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID が必要です' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('checklist_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('チェックリスト項目の削除に失敗しました:', error);
      return Response.json({ error: 'チェックリスト項目の削除に失敗しました' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}
