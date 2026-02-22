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

/** 管理者用チェックリスト項目作成スキーマ */
export const ItemCreateSchema = z.object({
  day: z.number().int().min(1).max(3),
  category: z.string().min(1, 'カテゴリを入力してください').max(50),
  title: z.string().min(1, 'タイトルを入力してください').max(200),
  summary: z.string().min(1, '概要を入力してください'),
  steps: z.array(z.string().min(1)).min(1, '手順を1件以上入力してください'),
  notes: z.string().optional(),
  orderIndex: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

/** 管理者用チェックリスト項目更新スキーマ */
export const ItemUpdateSchema = z.object({
  id: z.string().uuid(),
  day: z.number().int().min(1).max(3).optional(),
  category: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).optional(),
  steps: z.array(z.string().min(1)).min(1).optional(),
  notes: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
