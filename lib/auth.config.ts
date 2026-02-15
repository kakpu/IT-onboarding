import type { NextAuthConfig } from 'next-auth';

/**
 * NextAuth.js 共通設定（Edge Runtime対応）
 * ミドルウェアから使用するため、Node.js依存ライブラリを含めない
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    /** ミドルウェア用：未認証ユーザーをログインページへリダイレクト */
    authorized({ auth }) {
      return !!auth?.user;
    },
    /** JWTトークンにユーザー情報を含める */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    /** セッションにユーザーID・ロールを公開 */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // auth.tsでCredentials Providerを追加
} satisfies NextAuthConfig;
