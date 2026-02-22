import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendLog } from '@/lib/log';

describe('sendLog()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('正しいエンドポイントとボディでfetchを呼び出す', () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', mockFetch);

    sendLog('view', 'item-123', { page: '/day/1' });

    expect(mockFetch).toHaveBeenCalledWith('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checklistItemId: 'item-123',
        action: 'view',
        metadata: { page: '/day/1' },
      }),
    });
  });

  it('checklistItemIdなしでも呼び出せる', () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', mockFetch);

    sendLog('contact_click');

    expect(mockFetch).toHaveBeenCalledWith('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checklistItemId: undefined,
        action: 'contact_click',
        metadata: undefined,
      }),
    });
  });

  it('fetch失敗時にエラーをconsole.errorで出力する', async () => {
    const error = new Error('ネットワークエラー');
    const mockFetch = vi.fn().mockRejectedValue(error);
    vi.stubGlobal('fetch', mockFetch);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    sendLog('resolve');

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('ログ送信に失敗しました:', error);
    });
  });
});
