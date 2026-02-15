import { test, expect } from '@playwright/test';

/**
 * E2Eテスト: ログイン → Day1チェックリスト → 進捗更新
 * 前提: テストユーザーがデータベースに存在すること
 *
 * 環境変数で認証情報を指定:
 *   E2E_TEST_EMAIL, E2E_TEST_PASSWORD
 */
test.describe('オンボーディングフロー', () => {
  const email = process.env.E2E_TEST_EMAIL || 'test@example.com';
  const password = process.env.E2E_TEST_PASSWORD || 'password123';

  test('ログインしてDay1の項目を解決する', async ({ page }) => {
    // 1. ログインページへアクセス
    await page.goto('/auth/signin');
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();

    // 2. 認証情報を入力してログイン
    await page.getByLabel('メールアドレス').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: 'ログイン' }).click();

    // 3. トップページにリダイレクト → Dayカードが表示される
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Day1')).toBeVisible();

    // 4. Day1のカードをクリック
    await page.getByRole('link', { name: /Day1/ }).first().click();

    // Day1チェックリストページ
    await expect(page.getByText('Day1')).toBeVisible();

    // 5. 最初のチェックリスト項目の「解決した」ボタンをクリック
    const resolveButton = page.getByRole('button', { name: /解決した/ }).first();
    await resolveButton.click();

    // 6. 解決済み表示を確認
    await expect(page.getByText('解決済み').first()).toBeVisible();
  });
});
