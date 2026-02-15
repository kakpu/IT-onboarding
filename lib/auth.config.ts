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
    /** ミドルウェア用：認証・認可チェック */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminPath = nextUrl.pathname.startsWith('/admin');

      if (isAdminPath) {
        if (!isLoggedIn) return false;
        const role = (auth?.user as { role?: string })?.role;
        if (role !== 'admin' && role !== 'trainer') {
          return Response.redirect(new URL('/403', nextUrl));
        }
        return true;
      }

      return isLoggedIn;
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
