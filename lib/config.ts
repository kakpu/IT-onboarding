/**
 * アプリケーション設定
 * 問い合わせURLなど、環境変数で管理する値を一元化
 */

/** 教育担当への問い合わせ（Teamsチャット）URL */
export const CONTACT_URL =
  process.env.NEXT_PUBLIC_CONTACT_URL || 'https://teams.microsoft.com/l/chat/0/0';

/** 問い合わせボタンのラベル */
export const CONTACT_LABEL = '教育担当に問い合わせる';
