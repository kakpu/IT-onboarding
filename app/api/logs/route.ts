import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * ログ記録APIのリクエストボディスキーマ
 */
const CreateLogSchema = z.object({
  userId: z.string().uuid(),
  checklistItemId: z.string().uuid().optional(),
  action: z.enum(['view', 'resolve', 'unresolve', 'contact_click', 'share_link']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * 利用ログを記録するPOST API
 * @param request - Next.js Request
 * @returns 作成されたログデータ
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // バリデーション
    const result = CreateLogSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'リクエストボディが不正です',
            details: result.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { userId, checklistItemId, action, metadata } = result.data;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        checklist_item_id: checklistItemId || null,
        action,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('ログの記録に失敗しました:', error);
      return Response.json(
        {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'ログの記録に失敗しました',
          },
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        id: data.id,
        userId: data.user_id,
        checklistItemId: data.checklist_item_id,
        action: data.action,
        metadata: data.metadata,
        createdAt: data.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    return Response.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '予期しないエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}
