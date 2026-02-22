import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { UsersQuerySchema, UserUpdateRoleSchema } from '@/lib/schemas';

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

/** adminロールのみチェック */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: '認証が必要です', status: 401 };
  }
  const role = (session.user as { role?: string })?.role;
  if (role !== 'admin') {
    return { error: '管理者権限が必要です', status: 403 };
  }
  return { session };
}

/**
 * 管理者用ユーザー一覧取得（ページネーション・検索対応）
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminOrTrainer();
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const parsed = UsersQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { error: 'バリデーションエラー', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search } = parsed.data;
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // entra_idを除いたカラムを取得
    let query = supabase
      .from('users')
      .select('id, name, email, role, department, join_date, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error('ユーザー一覧の取得に失敗しました:', error);
      return Response.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
    }

    // 進捗率をまとめて取得（N+1回避）
    const userIds = (users ?? []).map((u) => u.id);
    const progressMap = new Map<string, { total: number; resolved: number }>();

    if (userIds.length > 0) {
      const { data: allProgress } = await supabase
        .from('user_progress')
        .select('user_id, status')
        .in('user_id', userIds);

      for (const row of allProgress ?? []) {
        const entry = progressMap.get(row.user_id) ?? { total: 0, resolved: 0 };
        entry.total++;
        if (row.status === 'resolved') entry.resolved++;
        progressMap.set(row.user_id, entry);
      }
    }

    const usersWithProgress = (users ?? []).map((user) => {
      const prog = progressMap.get(user.id) ?? { total: 0, resolved: 0 };
      const progressRate = prog.total > 0 ? Math.round((prog.resolved / prog.total) * 100) : 0;
      return { ...user, progressRate };
    });

    const total = count ?? 0;

    return Response.json({
      users: usersWithProgress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}

/**
 * 管理者用ユーザーロール更新（admin のみ可）
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const result = UserUpdateRoleSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: 'バリデーションエラー', details: result.error.issues },
        { status: 400 }
      );
    }

    const { id, role } = result.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, email, role, department, join_date')
      .single();

    if (error) {
      console.error('ロールの更新に失敗しました:', error);
      return Response.json({ error: 'ロールの更新に失敗しました' }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}
