import { z } from 'zod';

/** ユーザー登録リクエストのバリデーションスキーマ */
export const SignupSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
});

/** 進捗更新APIのリクエストボディスキーマ */
export const UpdateProgressSchema = z.object({
  status: z.enum(['pending', 'resolved', 'unresolved']),
  notes: z.string().optional(),
});

/** ログ記録APIのリクエストボディスキーマ */
export const CreateLogSchema = z.object({
  checklistItemId: z.string().uuid().optional(),
  action: z.enum(['view', 'resolve', 'unresolve', 'contact_click', 'share_link']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** チェックリスト項目取得APIのクエリパラメータスキーマ */
export const ChecklistItemsQuerySchema = z.object({
  day: z.enum(['1', '2', '3']).transform(Number),
});
