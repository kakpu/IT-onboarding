'use client';

import { Button } from '@/components/ui/button';
import { CONTACT_URL, CONTACT_LABEL } from '@/lib/config';

/**
 * 教育担当への問い合わせボタン
 * Teamsチャットリンクを新規タブで開く
 */
export function ContactButton() {
  return (
    <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" className="min-h-[44px]">
        💬 {CONTACT_LABEL}
      </Button>
    </a>
  );
}
