import { getUserId } from '@/lib/user';

type LogAction = 'view' | 'resolve' | 'unresolve' | 'contact_click' | 'share_link';

/**
 * 利用ログを送信する
 * ログ送信の失敗はユーザー操作をブロックしない（fire-and-forget）
 */
export function sendLog(
  action: LogAction,
  checklistItemId?: string,
  metadata?: Record<string, unknown>
) {
  const userId = getUserId();
  if (!userId) return;

  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      checklistItemId,
      action,
      metadata,
    }),
  }).catch((error) => {
    console.error('ログ送信に失敗しました:', error);
  });
}
