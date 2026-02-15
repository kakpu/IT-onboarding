type LogAction = 'view' | 'resolve' | 'unresolve' | 'contact_click' | 'share_link';

/**
 * 利用ログを送信する
 * ログ送信の失敗はユーザー操作をブロックしない（fire-and-forget）
 * @param action - ログのアクション種別
 * @param checklistItemId - チェックリスト項目ID（任意）
 * @param metadata - 追加メタデータ（任意）
 */
export function sendLog(
  action: LogAction,
  checklistItemId?: string,
  metadata?: Record<string, unknown>
) {
  // セッションからユーザーIDを取得してログ送信
  fetch('/api/auth/session')
    .then((res) => res.json())
    .then((session) => {
      const userId = session?.user?.id;
      if (!userId) return;

      return fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          checklistItemId,
          action,
          metadata,
        }),
      });
    })
    .catch((error) => {
      console.error('ログ送信に失敗しました:', error);
    });
}
