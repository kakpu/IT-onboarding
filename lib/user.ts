/**
 * クライアントサイドでセッションからユーザーIDを取得するユーティリティ
 * NextAuthセッションが利用できない場面（API呼び出し前等）での互換用
 */

/**
 * セッションからユーザーIDを取得する
 * NextAuth移行後はuseSession()を直接使用することを推奨
 * @returns セッションのユーザーID（取得できない場合は空文字）
 */
export async function fetchUserId(): Promise<string> {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) return '';
    const session = await res.json();
    return session?.user?.id || '';
  } catch {
    return '';
  }
}
