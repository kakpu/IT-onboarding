import { describe, it, expect } from 'vitest';
import {
  SignupSchema,
  UpdateProgressSchema,
  CreateLogSchema,
  ChecklistItemsQuerySchema,
} from '@/lib/schemas';

describe('SignupSchema', () => {
  it('正常なデータを受け入れる', () => {
    const result = SignupSchema.safeParse({
      name: 'テストユーザー',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('名前が空の場合はエラー', () => {
    const result = SignupSchema.safeParse({
      name: '',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('無効なメールアドレスはエラー', () => {
    const result = SignupSchema.safeParse({
      name: 'テスト',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('パスワードが8文字未満はエラー', () => {
    const result = SignupSchema.safeParse({
      name: 'テスト',
      email: 'test@example.com',
      password: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('名前が100文字超はエラー', () => {
    const result = SignupSchema.safeParse({
      name: 'a'.repeat(101),
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateProgressSchema', () => {
  it('resolvedステータスを受け入れる', () => {
    const result = UpdateProgressSchema.safeParse({ status: 'resolved' });
    expect(result.success).toBe(true);
  });

  it('unresolvedステータスを受け入れる', () => {
    const result = UpdateProgressSchema.safeParse({ status: 'unresolved' });
    expect(result.success).toBe(true);
  });

  it('pendingステータスを受け入れる', () => {
    const result = UpdateProgressSchema.safeParse({ status: 'pending' });
    expect(result.success).toBe(true);
  });

  it('notesはオプション', () => {
    const result = UpdateProgressSchema.safeParse({
      status: 'resolved',
      notes: 'メモ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('メモ');
    }
  });

  it('無効なステータスはエラー', () => {
    const result = UpdateProgressSchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('CreateLogSchema', () => {
  it('最小限のデータ（actionのみ）を受け入れる', () => {
    const result = CreateLogSchema.safeParse({ action: 'view' });
    expect(result.success).toBe(true);
  });

  it('全フィールド指定を受け入れる', () => {
    const result = CreateLogSchema.safeParse({
      checklistItemId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'resolve',
      metadata: { source: 'detail_page' },
    });
    expect(result.success).toBe(true);
  });

  it('無効なUUIDはエラー', () => {
    const result = CreateLogSchema.safeParse({
      checklistItemId: 'not-a-uuid',
      action: 'view',
    });
    expect(result.success).toBe(false);
  });

  it('無効なactionはエラー', () => {
    const result = CreateLogSchema.safeParse({ action: 'invalid_action' });
    expect(result.success).toBe(false);
  });

  it('全てのaction値を受け入れる', () => {
    const actions = ['view', 'resolve', 'unresolve', 'contact_click', 'share_link'];
    for (const action of actions) {
      const result = CreateLogSchema.safeParse({ action });
      expect(result.success).toBe(true);
    }
  });
});

describe('ChecklistItemsQuerySchema', () => {
  it('day=1を数値1に変換する', () => {
    const result = ChecklistItemsQuerySchema.safeParse({ day: '1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.day).toBe(1);
    }
  });

  it('day=2を数値2に変換する', () => {
    const result = ChecklistItemsQuerySchema.safeParse({ day: '2' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.day).toBe(2);
    }
  });

  it('day=3を数値3に変換する', () => {
    const result = ChecklistItemsQuerySchema.safeParse({ day: '3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.day).toBe(3);
    }
  });

  it('day=4（範囲外）はエラー', () => {
    const result = ChecklistItemsQuerySchema.safeParse({ day: '4' });
    expect(result.success).toBe(false);
  });

  it('day=0（範囲外）はエラー', () => {
    const result = ChecklistItemsQuerySchema.safeParse({ day: '0' });
    expect(result.success).toBe(false);
  });

  it('数値型の入力はエラー（文字列のみ受け付ける）', () => {
    const result = ChecklistItemsQuerySchema.safeParse({ day: 1 });
    expect(result.success).toBe(false);
  });
});
