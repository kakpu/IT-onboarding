import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'user_id';
const USER_NAME_KEY = 'user_name';

/**
 * ユーザーIDを取得する
 * ローカルストレージに保存されていない場合は新規UUIDを生成して保存
 * @returns ユーザーID（UUID）
 */
export function getUserId(): string {
  if (typeof window === 'undefined') return '';

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * ユーザー名を取得する
 * @returns ユーザー名（未設定の場合は空文字）
 */
export function getUserName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USER_NAME_KEY) || '';
}

/**
 * ユーザー名を設定する
 * 未入力の場合は「ゲスト」として保存
 * @param name - ユーザー名
 */
export function setUserName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_NAME_KEY, name || 'ゲスト');
}

/**
 * ユーザーのセットアップが完了しているか確認
 * @returns ユーザー名が保存されている場合はtrue
 */
export function hasUser(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(USER_NAME_KEY);
}
