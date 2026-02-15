import { describe, it, expect } from 'vitest';
import { authConfig } from '@/lib/auth.config';

describe('authConfig callbacks', () => {
  describe('authorized()', () => {
    const authorized = authConfig.callbacks.authorized!;

    const mockRequest = (pathname: string) => ({
      request: { nextUrl: new URL(`http://localhost:3000${pathname}`) },
    });

    it('認証済みユーザーは一般ページにアクセスできる', () => {
      const result = authorized({
        auth: { user: { id: '1', name: 'Test' } },
        ...mockRequest('/'),
      } as Parameters<typeof authorized>[0]);
      expect(result).toBe(true);
    });

    it('未認証ユーザーはfalseを返す', () => {
      const result = authorized({
        auth: null,
        ...mockRequest('/'),
      } as Parameters<typeof authorized>[0]);
      expect(result).toBe(false);
    });

    it('adminロールは/adminにアクセスできる', () => {
      const result = authorized({
        auth: { user: { id: '1', name: 'Admin', role: 'admin' } },
        ...mockRequest('/admin'),
      } as Parameters<typeof authorized>[0]);
      expect(result).toBe(true);
    });

    it('trainerロールは/adminにアクセスできる', () => {
      const result = authorized({
        auth: { user: { id: '1', name: 'Trainer', role: 'trainer' } },
        ...mockRequest('/admin'),
      } as Parameters<typeof authorized>[0]);
      expect(result).toBe(true);
    });

    it('userロールは/adminにアクセスするとリダイレクトされる', () => {
      const result = authorized({
        auth: { user: { id: '1', name: 'User', role: 'user' } },
        ...mockRequest('/admin'),
      } as Parameters<typeof authorized>[0]);
      expect(result).toBeInstanceOf(Response);
    });
  });

  describe('jwt()', () => {
    const jwt = authConfig.callbacks.jwt!;

    it('初回ログイン時にtokenにid/roleを設定する', async () => {
      const token = { sub: 'abc' };
      const user = { id: 'user-1', role: 'admin' };
      const result = await jwt({
        token,
        user,
      } as Parameters<typeof jwt>[0]);
      expect(result).toEqual(expect.objectContaining({ id: 'user-1', role: 'admin' }));
    });

    it('userがない場合（トークン更新時）はtokenをそのまま返す', async () => {
      const token = { sub: 'abc', id: 'user-1', role: 'user' };
      const result = await jwt({
        token,
        user: undefined,
      } as Parameters<typeof jwt>[0]);
      expect(result).toEqual(token);
    });
  });

  describe('session()', () => {
    const sessionCallback = authConfig.callbacks.session!;

    it('セッションにid/roleを公開する', async () => {
      const session = {
        user: { name: 'Test', email: 'test@example.com' },
        expires: '2099-01-01',
      };
      const token = { id: 'user-1', role: 'admin' };
      const result = await sessionCallback({
        session,
        token,
      } as Parameters<typeof sessionCallback>[0]);
      expect(result.user.id).toBe('user-1');
      expect((result.user as { role?: string }).role).toBe('admin');
    });
  });
});
