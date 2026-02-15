# Issue #22: テスト実装

## 背景 / 目的

重要なビジネスロジックの単体テストとE2Eテストを実装する。これにより、リグレッションを防ぎ、コードの品質を維持する。

- **依存**: #21
- **ラベル**: testing

## スコープ / 作業項目

1. Vitestパッケージ導入（単体テスト）
2. `/lib/`配下のユーティリティ関数の単体テスト作成
3. API RouteのZodバリデーションテスト作成
4. Playwright導入（E2Eテスト）
5. E2Eテスト作成（ログイン→Day1→進捗更新）
6. GitHub Actionsでテスト自動実行設定

## ゴール / 完了条件（Acceptance Criteria）

- [ ] Vitestパッケージ導入（`pnpm add -D vitest @testing-library/react`）
- [ ] `/lib/`配下のユーティリティ関数の単体テスト作成
- [ ] API RouteのZodバリデーションテスト作成
- [ ] Playwright導入（`pnpm add -D @playwright/test`）
- [ ] E2Eテスト作成（ログイン→Day1→進捗更新の一連フロー）
- [ ] GitHub Actionsでテスト自動実行設定

## テスト観点

- **単体テスト**: ユーティリティ関数が正しく動作すること
- **バリデーションテスト**: Zodスキーマが正しくバリデーションすること
- **E2Eテスト**: ログインから進捗更新までの一連フローが正常に動作すること
- **CI/CD**: GitHub Actionsでテストが自動実行されること

### 検証方法

```bash
# Vitest導入
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Playwright導入
pnpm add -D @playwright/test
pnpm exec playwright install

# 単体テスト実行
pnpm test

# E2Eテスト実行
pnpm exec playwright test

# カバレッジ確認
pnpm test:coverage
```

## 実装例

### /vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### /vitest.setup.ts

```typescript
import '@testing-library/jest-dom';
```

### /package.json（scripts追加）

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

### 単体テスト例

#### /lib/user.test.ts

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserId, setUserName, hasUser } from './user';

describe('user.ts', () => {
  beforeEach(() => {
    // ローカルストレージをクリア
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getUserId', () => {
    it('should generate and return UUID on first call', () => {
      const userId = getUserId();
      expect(userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should return same UUID on subsequent calls', () => {
      const userId1 = getUserId();
      const userId2 = getUserId();
      expect(userId1).toBe(userId2);
    });
  });

  describe('setUserName', () => {
    it('should save name to localStorage', () => {
      setUserName('John Doe');
      expect(localStorage.getItem('user_name')).toBe('John Doe');
    });

    it('should save "ゲスト" if name is empty', () => {
      setUserName('');
      expect(localStorage.getItem('user_name')).toBe('ゲスト');
    });
  });

  describe('hasUser', () => {
    it('should return false if no user', () => {
      expect(hasUser()).toBe(false);
    });

    it('should return true if user exists', () => {
      getUserId(); // UUIDを生成
      expect(hasUser()).toBe(true);
    });
  });
});
```

### バリデーションテスト例

#### /app/api/progress/[checklistItemId]/route.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const bodySchema = z.object({
  status: z.enum(['pending', 'resolved', 'unresolved']),
  notes: z.string().optional(),
  userId: z.string().uuid(),
});

describe('PUT /api/progress/:checklistItemId validation', () => {
  it('should accept valid input', () => {
    const input = {
      status: 'resolved',
      userId: '550e8400-e29b-41d4-a716-446655440000',
    };
    const result = bodySchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const input = {
      status: 'invalid',
      userId: '550e8400-e29b-41d4-a716-446655440000',
    };
    const result = bodySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID', () => {
    const input = {
      status: 'resolved',
      userId: 'invalid-uuid',
    };
    const result = bodySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should accept optional notes', () => {
    const input = {
      status: 'resolved',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'Test note',
    };
    const result = bodySchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
```

### E2Eテスト例

#### /e2e/login-and-progress.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login and Progress Flow', () => {
  test('should login and update progress', async ({ page }) => {
    // ログインページにアクセス
    await page.goto('http://localhost:3000');

    // ログイン（認証なしの場合は名前入力）
    await page.fill('input[placeholder="お名前を入力してください"]', 'Test User');
    await page.click('button:has-text("次へ")');

    // トップページが表示されることを確認
    await expect(page.locator('h1')).toContainText('ITオンボーディング');

    // Day1ページに遷移
    await page.click('a[href="/day/1"]');
    await expect(page.locator('h1')).toContainText('Day1');

    // 最初のチェックリスト項目の「解決した」ボタンをクリック
    await page.click('button:has-text("解決した")').first();

    // トーストまたは成功メッセージが表示されることを確認
    await page.waitForTimeout(1000);

    // トップページに戻る
    await page.goto('http://localhost:3000');

    // 進捗が更新されていることを確認
    await expect(page.locator('text=/\\d+%/')).toBeVisible();
  });
});
```

#### /playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### GitHub Actions設定

#### /.github/workflows/test.yml

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## テストカバレッジ目標

- **単体テスト**: 重要なユーティリティ関数は80%以上
- **E2Eテスト**: 主要なユーザーフロー（ログイン、進捗更新）をカバー

## 要確認事項

- テストカバレッジの目標値は80%でよいか？
- E2Eテストはどのブラウザで実行するか？（推奨: Chrome, Mobile Safari）
