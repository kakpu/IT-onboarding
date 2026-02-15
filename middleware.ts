import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * 以下のパスを除くすべてのルートで認証チェックを実行:
     * - /auth/* (ログイン・登録ページ)
     * - /api/auth/* (NextAuth APIルート)
     * - /_next/* (Next.js 内部ファイル)
     * - /favicon.ico, /robots.txt 等の静的ファイル
     */
    '/((?!auth|api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
