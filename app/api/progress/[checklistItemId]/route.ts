import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * 進捗更新APIのリクエストボディスキーマ
 */
const UpdateProgressSchema = z.object({
  status: z.enum(['pending', 'resolved', 'unresolved']),
  notes: z.string().optional(),
  userId: z.string().uuid(),
});

/**
 * 進捗を更新するPUT API
 * @param request - Next.js Request
 * @param params - Dynamic route params
 * @returns 更新された進捗データ
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ checklistItemId: string }> }
) {
  try {
    const { checklistItemId } = await params;
    const body = await request.json();

    // バリデーション
    const result = UpdateProgressSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: 'リクエストボディが不正です',
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const { status, notes, userId } = result.data;

    const supabase = await createClient();

    // UPSERT: user_id + checklist_item_id がユニークキー
    const { data, error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          checklist_item_id: checklistItemId,
          status,
          notes: notes || null,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,checklist_item_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('進捗の更新に失敗しました:', error);
      return Response.json({ error: '進捗の更新に失敗しました' }, { status: 500 });
    }

    return Response.json({
      id: data.id,
      checklistItemId: data.checklist_item_id,
      status: data.status,
      resolvedAt: data.resolved_at,
      notes: data.notes,
    });
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}
