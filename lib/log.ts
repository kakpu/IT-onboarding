type LogAction = 'view' | 'resolve' | 'unresolve' | 'contact_click' | 'share_link';

/**
 * 利用ログを送信する
 * ログ送信の失敗はユーザー操作をブロックしない（fire-and-forget）
 * userIdはサーバー側でセッションから取得するため送信不要
 * @param action - ログのアクション種別
 * @param checklistItemId - チェックリスト項目ID（任意）
 * @param metadata - 追加メタデータ（任意）
 */
export function sendLog(
  action: LogAction,
  checklistItemId?: string,
  metadata?: Record<string, unknown>
) {
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      checklistItemId,
      action,
      metadata,
    }),
  }).catch((error) => {
    console.error('ログ送信に失敗しました:', error);
  });
}
