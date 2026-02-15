import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('デフォルトのCONTACT_URLを返す', async () => {
    delete process.env.NEXT_PUBLIC_CONTACT_URL;
    const { CONTACT_URL } = await import('@/lib/config');
    expect(CONTACT_URL).toBe('https://teams.microsoft.com/l/chat/0/0');
  });

  it('環境変数が設定されていればそちらを使う', async () => {
    process.env.NEXT_PUBLIC_CONTACT_URL = 'https://custom.example.com';
    const { CONTACT_URL } = await import('@/lib/config');
    expect(CONTACT_URL).toBe('https://custom.example.com');
  });

  it('CONTACT_LABELは固定文字列を返す', async () => {
    const { CONTACT_LABEL } = await import('@/lib/config');
    expect(CONTACT_LABEL).toBe('教育担当に問い合わせる');
  });
});
